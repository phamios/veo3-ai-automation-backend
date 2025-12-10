import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto } from './dto';
interface AuthenticatedUser {
    id: string;
    email: string;
    name: string;
    role: string;
    sessionId: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        email: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.Role;
    }>;
    login(dto: LoginDto, req: Request): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
        };
    }>;
    logout(user: AuthenticatedUser): Promise<{
        message: string;
    }>;
    getMe(user: AuthenticatedUser): Promise<{
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
    getSessionStatus(user: AuthenticatedUser): Promise<{
        valid: boolean;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    changePassword(user: AuthenticatedUser, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
}
export {};
