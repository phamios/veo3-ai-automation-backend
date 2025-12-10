import { LicenseStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { LicensesService } from '../../licenses/licenses.service';
export declare class AdminLicensesService {
    private prisma;
    private licensesService;
    constructor(prisma: PrismaService, licensesService: LicensesService);
    findAll(params: {
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
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
    generate(params: {
        userId: string;
        packageId: string;
        maxDevices?: number;
        adminId: string;
    }): Promise<{
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
    update(id: string, data: {
        maxDevices?: number;
        endDate?: Date;
        status?: LicenseStatus;
    }): Promise<{
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
    revoke(id: string, reason: string): Promise<{
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
    getDevices(licenseId: string): Promise<{
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
    resetAllDevices(licenseId: string): Promise<{
        message: string;
    }>;
}
