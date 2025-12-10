"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const prisma_service_1 = require("../../../prisma/prisma.service");
const redis_service_1 = require("../../../redis/redis.service");
const error_codes_1 = require("../../../common/constants/error-codes");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    configService;
    prisma;
    redis;
    constructor(configService, prisma, redis) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET') || 'default-secret-change-in-production',
        });
        this.configService = configService;
        this.prisma = prisma;
        this.redis = redis;
    }
    async validate(payload) {
        const { userId, sessionId } = payload;
        const sessionKey = `session:${sessionId}`;
        const sessionExists = await this.redis.exists(sessionKey);
        if (!sessionExists) {
            throw new common_1.UnauthorizedException({
                code: error_codes_1.ErrorCodes.SESSION_INVALID,
                message: 'Session expired or invalid',
            });
        }
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
            throw new common_1.UnauthorizedException({
                code: error_codes_1.ErrorCodes.USER_NOT_FOUND,
                message: 'User not found',
            });
        }
        if (user.currentSessionId !== sessionId) {
            throw new common_1.UnauthorizedException({
                code: error_codes_1.ErrorCodes.SESSION_INVALID,
                message: 'Session invalidated - logged in from another device',
            });
        }
        return { ...user, sessionId };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map