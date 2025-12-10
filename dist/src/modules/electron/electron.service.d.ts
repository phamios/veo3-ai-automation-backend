import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { EmailService } from '../notifications/email.service';
import { ActivateLicenseDto, LogActivityDto, CheckLimitDto } from './dto';
interface ElectronJwtPayload {
    licenseId: string;
    hardwareId: string;
    userId: string;
}
export declare class ElectronService {
    private prisma;
    private redis;
    private jwtService;
    private configService;
    private emailService;
    constructor(prisma: PrismaService, redis: RedisService, jwtService: JwtService, configService: ConfigService, emailService: EmailService);
    activate(dto: ActivateLicenseDto, ipAddress?: string): Promise<{
        token: string;
        license: {
            id: string;
            licenseKey: string;
            status: string;
            startDate: Date;
            endDate: Date;
            maxDevices: number;
            package: {
                name: string;
                videosPerMonth: number;
                keywordsTracking: number;
                apiCallsPerMonth: number;
            };
        };
        device: {
            id: string;
            isActive: boolean;
            lastLoginAt: Date | null;
            ipAddress: string | null;
            activatedAt: Date;
            licenseId: string;
            hardwareId: string;
            deviceName: string;
            deviceOS: string;
            deactivatedAt: Date | null;
            deactivatedReason: string | null;
        };
        message: string;
    }>;
    verify(payload: ElectronJwtPayload): Promise<{
        valid: boolean;
        license: {
            id: string;
            licenseKey: string;
            status: string;
            startDate: Date;
            endDate: Date;
            maxDevices: number;
            package: {
                name: string;
                videosPerMonth: number;
                keywordsTracking: number;
                apiCallsPerMonth: number;
            };
        };
        daysRemaining: number;
    }>;
    refreshToken(payload: ElectronJwtPayload): Promise<{
        token: string;
    }>;
    getDevices(payload: ElectronJwtPayload): Promise<{
        devices: {
            id: string;
            isActive: boolean;
            lastLoginAt: Date | null;
            activatedAt: Date;
            deviceName: string;
            deviceOS: string;
        }[];
        currentDevice: string;
    }>;
    requestDeactivateOtp(payload: ElectronJwtPayload, deviceId: string): Promise<{
        message: string;
        expiresIn: number;
    }>;
    deactivateDevice(payload: ElectronJwtPayload, deviceId: string, otp: string, currentHardwareId: string): Promise<{
        message: string;
    }>;
    getLicenseInfo(payload: ElectronJwtPayload): Promise<{
        license: {
            id: string;
            licenseKey: string;
            status: import("@prisma/client").$Enums.LicenseStatus;
            startDate: Date;
            endDate: Date;
            daysRemaining: number;
        };
        package: {
            name: string;
            videosPerMonth: number;
            keywordsTracking: number;
            apiCallsPerMonth: number;
        };
        devices: {
            active: number;
            max: number;
        };
    }>;
    logActivity(payload: ElectronJwtPayload, dto: LogActivityDto, ipAddress?: string): Promise<{
        logged: boolean;
    }>;
    getUsageStats(payload: ElectronJwtPayload): Promise<{
        usage: Record<string, number>;
        limits: {
            videosPerMonth: number;
            keywordsTracking: number;
            apiCallsPerMonth: number;
        };
        periodStart: Date;
    }>;
    checkLimit(payload: ElectronJwtPayload, dto: CheckLimitDto): Promise<{
        canProceed: boolean;
        remaining: number;
        limit?: undefined;
        used?: undefined;
    } | {
        canProceed: boolean;
        remaining: number;
        limit: number;
        used: number;
    }>;
    private generateElectronToken;
    private formatLicenseResponse;
}
export {};
