import type { Request } from 'express';
import { ElectronService } from './electron.service';
import { ActivateLicenseDto, RequestOtpDto, DeactivateDeviceDto, LogActivityDto, CheckLimitDto } from './dto';
interface ElectronRequest extends Request {
    electronUser: {
        licenseId: string;
        hardwareId: string;
        userId: string;
    };
}
export declare class ElectronController {
    private readonly electronService;
    constructor(electronService: ElectronService);
    activate(dto: ActivateLicenseDto, req: Request): Promise<{
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
    verify(req: ElectronRequest): Promise<{
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
    refreshToken(req: ElectronRequest): Promise<{
        token: string;
    }>;
    getLicenseInfo(req: ElectronRequest): Promise<{
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
    getDevices(req: ElectronRequest): Promise<{
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
    requestDeactivateOtp(req: ElectronRequest, dto: RequestOtpDto): Promise<{
        message: string;
        expiresIn: number;
    }>;
    deactivateDevice(req: ElectronRequest, dto: DeactivateDeviceDto): Promise<{
        message: string;
    }>;
    logActivity(req: ElectronRequest, dto: LogActivityDto): Promise<{
        logged: boolean;
    }>;
    getUsageStats(req: ElectronRequest): Promise<{
        usage: Record<string, number>;
        limits: {
            videosPerMonth: number;
            keywordsTracking: number;
            apiCallsPerMonth: number;
        };
        periodStart: Date;
    }>;
    checkLimit(req: ElectronRequest, dto: CheckLimitDto): Promise<{
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
}
export {};
