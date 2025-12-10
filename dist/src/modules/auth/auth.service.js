"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const uuid_1 = require("uuid");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const error_codes_1 = require("../../common/constants/error-codes");
const utils_1 = require("../../utils");
let AuthService = class AuthService {
    prisma;
    redis;
    jwtService;
    configService;
    constructor(prisma, redis, jwtService, configService) {
        this.prisma = prisma;
        this.redis = redis;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async register(dto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (existingUser) {
            throw new common_1.ConflictException({
                code: error_codes_1.ErrorCodes.EMAIL_EXISTS,
                message: 'Email already exists',
            });
        }
        const saltRoundsStr = this.configService.get('BCRYPT_SALT_ROUNDS');
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
    async login(dto, ip, userAgent) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (!user) {
            throw new common_1.UnauthorizedException({
                code: error_codes_1.ErrorCodes.INVALID_CREDENTIALS,
                message: 'Invalid email or password',
            });
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException({
                code: error_codes_1.ErrorCodes.INVALID_CREDENTIALS,
                message: 'Invalid email or password',
            });
        }
        if (user.currentSessionId) {
            await this.redis.del(`session:${user.currentSessionId}`);
            await this.prisma.session.updateMany({
                where: { userId: user.id, isActive: true },
                data: { isActive: false },
            });
        }
        const sessionId = (0, uuid_1.v4)();
        const sessionMaxAgeStr = this.configService.get('SESSION_MAX_AGE');
        const sessionMaxAge = sessionMaxAgeStr ? parseInt(sessionMaxAgeStr, 10) : 86400000;
        const expiresAt = new Date(Date.now() + sessionMaxAge);
        await this.redis.setex(`session:${sessionId}`, Math.floor(sessionMaxAge / 1000), JSON.stringify({ userId: user.id, createdAt: new Date().toISOString() }));
        await this.prisma.session.create({
            data: {
                sessionId,
                userId: user.id,
                ipAddress: ip,
                userAgent,
                expiresAt,
            },
        });
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                currentSessionId: sessionId,
                lastLoginAt: new Date(),
                lastLoginIp: ip,
            },
        });
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
    async logout(userId, sessionId) {
        await this.redis.del(`session:${sessionId}`);
        await this.prisma.session.updateMany({
            where: { sessionId },
            data: { isActive: false },
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: { currentSessionId: null },
        });
        return { message: 'Logged out successfully' };
    }
    async validateSession(userId, sessionId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { currentSessionId: true },
        });
        if (!user || user.currentSessionId !== sessionId) {
            throw new common_1.UnauthorizedException({
                code: error_codes_1.ErrorCodes.SESSION_INVALID,
                message: 'Session invalid or expired',
            });
        }
        return { valid: true };
    }
    async forgotPassword(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (!user) {
            return { message: 'If email exists, reset link will be sent' };
        }
        const resetToken = (0, utils_1.generateSecureToken)();
        const resetExpires = new Date(Date.now() + 3600000);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: resetToken,
                passwordResetExpires: resetExpires,
            },
        });
        return { message: 'If email exists, reset link will be sent' };
    }
    async resetPassword(dto) {
        const user = await this.prisma.user.findFirst({
            where: {
                passwordResetToken: dto.token,
                passwordResetExpires: { gt: new Date() },
            },
        });
        if (!user) {
            throw new common_1.BadRequestException({
                code: error_codes_1.ErrorCodes.INVALID_TOKEN,
                message: 'Invalid or expired reset token',
            });
        }
        const saltRounds = this.configService.get('BCRYPT_SALT_ROUNDS', 10);
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
    async changePassword(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.USER_NOT_FOUND,
                message: 'User not found',
            });
        }
        const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
        if (!isPasswordValid) {
            throw new common_1.BadRequestException({
                code: error_codes_1.ErrorCodes.INVALID_CREDENTIALS,
                message: 'Current password is incorrect',
            });
        }
        const saltRounds = this.configService.get('BCRYPT_SALT_ROUNDS', 10);
        const hashedPassword = await bcrypt.hash(dto.newPassword, saltRounds);
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                currentSessionId: null,
            },
        });
        await this.prisma.session.updateMany({
            where: { userId },
            data: { isActive: false },
        });
        return { message: 'Password changed successfully. Please login again.' };
    }
    async getMe(userId) {
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
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.USER_NOT_FOUND,
                message: 'User not found',
            });
        }
        return user;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map