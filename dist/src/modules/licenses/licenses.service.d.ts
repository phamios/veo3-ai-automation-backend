import { PrismaService } from '../../prisma/prisma.service';
import { CreateLicenseDto } from './dto/create-license.dto';
export declare class LicensesService {
    private prisma;
    constructor(prisma: PrismaService);
    generateKey(): Promise<string>;
    create(dto: CreateLicenseDto, createdById: string): Promise<{
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
    findByKey(licenseKey: string): Promise<{
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
    validateLicense(licenseKey: string): Promise<{
        valid: boolean;
        license: {
            id: string;
            licenseKey: string;
            status: "UNUSED" | "ACTIVE";
            maxDevices: number;
            activeDevices: number;
            startDate: Date;
            endDate: Date;
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
        };
    }>;
    getDeviceCount(licenseId: string): Promise<number>;
    addDevice(licenseId: string, deviceData: {
        hardwareId: string;
        deviceName: string;
        deviceOS: string;
        ipAddress?: string;
    }): Promise<{
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
    removeDevice(deviceId: string, reason?: string): Promise<{
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
    revoke(licenseId: string, reason: string): Promise<{
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
}
