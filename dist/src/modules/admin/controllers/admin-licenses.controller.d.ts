import { LicenseStatus } from '@prisma/client';
import { AdminLicensesService } from '../services/admin-licenses.service';
interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: string;
}
declare class GenerateLicenseDto {
    userId: string;
    packageId: string;
    maxDevices?: number;
}
declare class UpdateLicenseDto {
    maxDevices?: number;
    endDate?: Date;
    status?: LicenseStatus;
}
declare class RevokeLicenseDto {
    reason: string;
}
export declare class AdminLicensesController {
    private readonly licensesService;
    constructor(licensesService: AdminLicensesService);
    findAll(status?: string, search?: string, page?: number, limit?: number): Promise<{
        licenses: ({
            package: {
                name: string;
            };
            user: {
                name: string;
                email: string;
            };
            _count: {
                devices: number;
            };
        } & {
            id: string;
            durationMonths: number;
            maxDevices: number;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            licenseKey: string;
            orderId: string;
            packageId: string;
            startDate: Date;
            endDate: Date;
            status: import("@prisma/client").$Enums.LicenseStatus;
            appDownloadLink: string | null;
            appVersion: string | null;
            createdById: string;
            activatedAt: Date | null;
            revokedAt: Date | null;
            revokedReason: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        package: {
            id: string;
            slug: string;
            name: string;
            description: string | null;
            durationMonths: number;
            originalPrice: import("@prisma/client/runtime/library").Decimal;
            salePrice: import("@prisma/client/runtime/library").Decimal;
            discountPercent: number;
            features: import("@prisma/client/runtime/library").JsonValue;
            videosPerMonth: number;
            keywordsTracking: number;
            apiCallsPerMonth: number;
            maxDevices: number;
            isPopular: boolean;
            isActive: boolean;
            sortOrder: number;
            createdAt: Date;
            updatedAt: Date;
        };
        user: {
            id: string;
            name: string;
            email: string;
        };
        order: {
            orderNumber: string;
            amount: import("@prisma/client/runtime/library").Decimal;
        } | null;
        createdBy: {
            name: string;
            email: string;
        };
        devices: {
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
        }[];
    } & {
        id: string;
        durationMonths: number;
        maxDevices: number;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        licenseKey: string;
        orderId: string;
        packageId: string;
        startDate: Date;
        endDate: Date;
        status: import("@prisma/client").$Enums.LicenseStatus;
        appDownloadLink: string | null;
        appVersion: string | null;
        createdById: string;
        activatedAt: Date | null;
        revokedAt: Date | null;
        revokedReason: string | null;
    }>;
    generate(admin: AdminUser, dto: GenerateLicenseDto): Promise<{
        package: {
            name: string;
            durationMonths: number;
        };
        user: {
            name: string;
            email: string;
        };
    } & {
        id: string;
        durationMonths: number;
        maxDevices: number;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        licenseKey: string;
        orderId: string;
        packageId: string;
        startDate: Date;
        endDate: Date;
        status: import("@prisma/client").$Enums.LicenseStatus;
        appDownloadLink: string | null;
        appVersion: string | null;
        createdById: string;
        activatedAt: Date | null;
        revokedAt: Date | null;
        revokedReason: string | null;
    }>;
    update(id: string, dto: UpdateLicenseDto): Promise<{
        package: {
            name: string;
        };
        user: {
            name: string;
            email: string;
        };
    } & {
        id: string;
        durationMonths: number;
        maxDevices: number;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        licenseKey: string;
        orderId: string;
        packageId: string;
        startDate: Date;
        endDate: Date;
        status: import("@prisma/client").$Enums.LicenseStatus;
        appDownloadLink: string | null;
        appVersion: string | null;
        createdById: string;
        activatedAt: Date | null;
        revokedAt: Date | null;
        revokedReason: string | null;
    }>;
    revoke(id: string, dto: RevokeLicenseDto): Promise<{
        id: string;
        durationMonths: number;
        maxDevices: number;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        licenseKey: string;
        orderId: string;
        packageId: string;
        startDate: Date;
        endDate: Date;
        status: import("@prisma/client").$Enums.LicenseStatus;
        appDownloadLink: string | null;
        appVersion: string | null;
        createdById: string;
        activatedAt: Date | null;
        revokedAt: Date | null;
        revokedReason: string | null;
    }>;
    getDevices(id: string): Promise<{
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
    }[]>;
    removeDevice(licenseId: string, deviceId: string): Promise<{
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
    }>;
    resetAllDevices(id: string): Promise<{
        message: string;
    }>;
}
export {};
