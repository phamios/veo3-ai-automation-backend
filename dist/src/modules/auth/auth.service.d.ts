import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto } from './dto';
export declare class AuthService {
    private prisma;
    private redis;
    private jwtService;
    private configService;
    constructor(prisma: PrismaService, redis: RedisService, jwtService: JwtService, configService: ConfigService);
    register(dto: RegisterDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        email: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.Role;
    }>;
    login(dto: LoginDto, ip?: string, userAgent?: string): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
        };
    }>;
    logout(userId: string, sessionId: string): Promise<{
        message: string;
    }>;
    validateSession(userId: string, sessionId: string): Promise<{
        valid: boolean;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    getMe(userId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        email: string;
        phone: string | null;
        avatar: string | null;
        role: import("@prisma/client").$Enums.Role;
        telegramContact: string | null;
        zaloContact: string | null;
        preferredContactMethod: import("@prisma/client").$Enums.ContactMethod;
        isEmailVerified: boolean;
    }>;
}
