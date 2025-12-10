import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { ErrorCodes } from '../../common/constants/error-codes';
import { generateSecureToken } from '../../utils';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException({
        code: ErrorCodes.EMAIL_EXISTS,
        message: 'Email already exists',
      });
    }

    const saltRoundsStr = this.configService.get<string>('BCRYPT_SALT_ROUNDS');
    const saltRounds = saltRoundsStr ? parseInt(saltRoundsStr, 10) : 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        name: dto.name,
        phone: dto.phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCodes.INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: ErrorCodes.INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    // Invalidate old sessions
    if (user.currentSessionId) {
      await this.redis.del(`session:${user.currentSessionId}`);
      await this.prisma.session.updateMany({
        where: { userId: user.id, isActive: true },
        data: { isActive: false },
      });
    }

    // Create new session
    const sessionId = uuidv4();
    const sessionMaxAgeStr = this.configService.get<string>('SESSION_MAX_AGE');
    const sessionMaxAge = sessionMaxAgeStr ? parseInt(sessionMaxAgeStr, 10) : 86400000;
    const expiresAt = new Date(Date.now() + sessionMaxAge);

    // Save session to Redis
    await this.redis.setex(
      `session:${sessionId}`,
      Math.floor(sessionMaxAge / 1000),
      JSON.stringify({ userId: user.id, createdAt: new Date().toISOString() }),
    );

    // Save session to database
    await this.prisma.session.create({
      data: {
        sessionId,
        userId: user.id,
        ipAddress: ip,
        userAgent,
        expiresAt,
      },
    });

    // Update user's current session
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        currentSessionId: sessionId,
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    });

    // Generate JWT
    const accessToken = this.jwtService.sign({
      userId: user.id,
      sessionId,
    });

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async logout(userId: string, sessionId: string) {
    // Remove session from Redis
    await this.redis.del(`session:${sessionId}`);

    // Deactivate session in database
    await this.prisma.session.updateMany({
      where: { sessionId },
      data: { isActive: false },
    });

    // Clear user's current session
    await this.prisma.user.update({
      where: { id: userId },
      data: { currentSessionId: null },
    });

    return { message: 'Logged out successfully' };
  }

  async validateSession(userId: string, sessionId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentSessionId: true },
    });

    if (!user || user.currentSessionId !== sessionId) {
      throw new UnauthorizedException({
        code: ErrorCodes.SESSION_INVALID,
        message: 'Session invalid or expired',
      });
    }

    return { valid: true };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Always return success message to prevent email enumeration
    if (!user) {
      return { message: 'If email exists, reset link will be sent' };
    }

    const resetToken = generateSecureToken();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // TODO: Send email with reset link via EmailService
    // const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;

    return { message: 'If email exists, reset link will be sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: dto.token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_TOKEN,
        message: 'Invalid or expired reset token',
      });
    }

    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10);
    const hashedPassword = await bcrypt.hash(dto.newPassword, saltRounds);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException({
        code: ErrorCodes.USER_NOT_FOUND,
        message: 'User not found',
      });
    }

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_CREDENTIALS,
        message: 'Current password is incorrect',
      });
    }

    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10);
    const hashedPassword = await bcrypt.hash(dto.newPassword, saltRounds);

    // Update password and invalidate all sessions
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        currentSessionId: null,
      },
    });

    // Deactivate all sessions
    await this.prisma.session.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    return { message: 'Password changed successfully. Please login again.' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        telegramContact: true,
        zaloContact: true,
        preferredContactMethod: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: ErrorCodes.USER_NOT_FOUND,
        message: 'User not found',
      });
    }

    return user;
  }
}
