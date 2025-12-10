import { AdminOrdersService } from '../services/admin-orders.service';
import { ApproveOrderDto, RejectOrderDto } from '../dto';
interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: string;
}
export declare class AdminOrdersController {
    private readonly ordersService;
    constructor(ordersService: AdminOrdersService);
    findAll(status?: string, search?: string, page?: number, limit?: number): Promise<{
        orders: ({
            package: {
                name: string;
                durationMonths: number;
            };
            user: {
                id: string;
                name: string;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            expiresAt: Date;
            packageId: string;
            status: import("@prisma/client").$Enums.OrderStatus;
            orderNumber: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            transferContent: string;
            userConfirmedAt: Date | null;
            approvedAt: Date | null;
            approvedById: string | null;
            rejectedAt: Date | null;
            rejectedById: string | null;
            rejectionReason: string | null;
            licenseId: string | null;
            deliveryMethod: import("@prisma/client").$Enums.ContactMethod | null;
            deliveryContact: string | null;
            deliveredAt: Date | null;
            adminNotes: string | null;
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
            phone: string | null;
        };
        license: ({
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
        }) | null;
        approvedBy: {
            name: string;
            email: string;
        } | null;
        rejectedBy: {
            name: string;
            email: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        expiresAt: Date;
        packageId: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        orderNumber: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        transferContent: string;
        userConfirmedAt: Date | null;
        approvedAt: Date | null;
        approvedById: string | null;
        rejectedAt: Date | null;
        rejectedById: string | null;
        rejectionReason: string | null;
        licenseId: string | null;
        deliveryMethod: import("@prisma/client").$Enums.ContactMethod | null;
        deliveryContact: string | null;
        deliveredAt: Date | null;
        adminNotes: string | null;
    }>;
    approve(id: string, admin: AdminUser, dto: ApproveOrderDto): Promise<{
        package: {
            name: string;
        };
        user: {
            name: string;
            email: string;
        };
        license: {
            licenseKey: string;
            endDate: Date;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        expiresAt: Date;
        packageId: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        orderNumber: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        transferContent: string;
        userConfirmedAt: Date | null;
        approvedAt: Date | null;
        approvedById: string | null;
        rejectedAt: Date | null;
        rejectedById: string | null;
        rejectionReason: string | null;
        licenseId: string | null;
        deliveryMethod: import("@prisma/client").$Enums.ContactMethod | null;
        deliveryContact: string | null;
        deliveredAt: Date | null;
        adminNotes: string | null;
    }>;
    reject(id: string, admin: AdminUser, dto: RejectOrderDto): Promise<{
        package: {
            name: string;
        };
        user: {
            name: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        expiresAt: Date;
        packageId: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        orderNumber: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        transferContent: string;
        userConfirmedAt: Date | null;
        approvedAt: Date | null;
        approvedById: string | null;
        rejectedAt: Date | null;
        rejectedById: string | null;
        rejectionReason: string | null;
        licenseId: string | null;
        deliveryMethod: import("@prisma/client").$Enums.ContactMethod | null;
        deliveryContact: string | null;
        deliveredAt: Date | null;
        adminNotes: string | null;
    }>;
}
export {};
