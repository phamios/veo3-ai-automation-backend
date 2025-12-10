import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../../redis/redis.service';
import { ErrorCodes } from '../../../common/constants/error-codes';

interface JwtPayload {
  userId: string;
  sessionId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private redis: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret-change-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    const { userId, sessionId } = payload;

    // Check if session exists in Redis
    const sessionKey = `session:${sessionId}`;
    const sessionExists = await this.redis.exists(sessionKey);

    if (!sessionExists) {
      throw new UnauthorizedException({
        code: ErrorCodes.SESSION_INVALID,
        message: 'Session expired or invalid',
      });
    }

    // Get user from database
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        currentSessionId: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCodes.USER_NOT_FOUND,
        message: 'User not found',
      });
    }

    // Check if current session matches user's active session (single session enforcement)
    if (user.currentSessionId !== sessionId) {
      throw new UnauthorizedException({
        code: ErrorCodes.SESSION_INVALID,
        message: 'Session invalidated - logged in from another device',
      });
    }

    return { ...user, sessionId };
  }
}
