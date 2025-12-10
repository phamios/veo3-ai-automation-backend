import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
interface AuthenticatedUser {
    id: string;
    email: string;
    name: string;
    role: string;
}
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(user: AuthenticatedUser, dto: CreateOrderDto): Promise<{
        order: {
            package: {
                name: string;
                durationMonths: number;
                salePrice: import("@prisma/client/runtime/library").Decimal;
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
        };
        payment: {
            transferContent: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            expiresAt: Date;
        };
    }>;
    findOne(user: AuthenticatedUser, id: string): Promise<{
        package: {
            name: string;
            durationMonths: number;
            originalPrice: import("@prisma/client/runtime/library").Decimal;
            salePrice: import("@prisma/client/runtime/library").Decimal;
            discountPercent: number;
        };
        license: {
            licenseKey: string;
            startDate: Date;
            endDate: Date;
            status: import("@prisma/client").$Enums.LicenseStatus;
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
    confirm(user: AuthenticatedUser, id: string): Promise<{
        package: {
            name: string;
            salePrice: import("@prisma/client/runtime/library").Decimal;
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
    getStatus(user: AuthenticatedUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        license: {
            licenseKey: string;
            status: import("@prisma/client").$Enums.LicenseStatus;
        } | null;
        status: import("@prisma/client").$Enums.OrderStatus;
        orderNumber: string;
        userConfirmedAt: Date | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        rejectionReason: string | null;
    }>;
}
export {};
