import { AdminUsersService } from '../services/admin-users.service';
interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: string;
}
declare class UpdateUserDto {
    name?: string;
    phone?: string;
    role?: 'USER' | 'ADMIN';
    isEmailVerified?: boolean;
}
declare class ExtendSubscriptionDto {
    licenseId: string;
    months: number;
}
export declare class AdminUsersController {
    private readonly usersService;
    constructor(usersService: AdminUsersService);
    findAll(search?: string, page?: number, limit?: number): Promise<{
        users: {
            id: string;
            name: string;
            createdAt: Date;
            email: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.Role;
            isEmailVerified: boolean;
            _count: {
                orders: number;
                licenses: number;
            };
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        orders: {
            id: string;
            createdAt: Date;
            package: {
                name: string;
            };
            status: import("@prisma/client").$Enums.OrderStatus;
            orderNumber: string;
            amount: import("@prisma/client/runtime/library").Decimal;
        }[];
        licenses: {
            id: string;
            package: {
                name: string;
            };
            _count: {
                devices: number;
            };
            licenseKey: string;
            startDate: Date;
            endDate: Date;
            status: import("@prisma/client").$Enums.LicenseStatus;
        }[];
        email: string;
        phone: string | null;
        avatar: string | null;
        role: import("@prisma/client").$Enums.Role;
        telegramContact: string | null;
        zaloContact: string | null;
        preferredContactMethod: import("@prisma/client").$Enums.ContactMethod;
        isEmailVerified: boolean;
        lastLoginAt: Date | null;
        lastLoginIp: string | null;
    }>;
    update(id: string, dto: UpdateUserDto): Promise<{
        id: string;
        name: string;
        updatedAt: Date;
        email: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.Role;
        isEmailVerified: boolean;
    }>;
    extendSubscription(userId: string, admin: AdminUser, dto: ExtendSubscriptionDto): Promise<{
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
export {};
