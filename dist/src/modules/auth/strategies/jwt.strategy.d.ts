import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../../redis/redis.service';
interface JwtPayload {
    userId: string;
    sessionId: string;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private prisma;
    private redis;
    constructor(configService: ConfigService, prisma: PrismaService, redis: RedisService);
    validate(payload: JwtPayload): Promise<{
        sessionId: string;
        id: string;
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        currentSessionId: string | null;
        isEmailVerified: boolean;
    }>;
}
export {};
