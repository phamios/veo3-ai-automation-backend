import { PrismaService } from '../../prisma/prisma.service';
import { TelegramService } from '../notifications/telegram.service';
import { CreateOrderDto } from './dto/create-order.dto';
export declare class OrdersService {
    private prisma;
    private telegramService;
    constructor(prisma: PrismaService, telegramService: TelegramService);
    create(userId: string, dto: CreateOrderDto): Promise<{
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
    findOne(userId: string, orderId: string): Promise<{
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
    confirm(userId: string, orderId: string): Promise<{
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
    getStatus(userId: string, orderId: string): Promise<{
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
