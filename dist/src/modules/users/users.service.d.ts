import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    getProfile(userId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        email: string;
        phone: string | null;
        avatar: string | null;
        role: import("@prisma/client").$Enums.Role;
        telegramContact: string | null;
        zaloContact: string | null;
        preferredContactMethod: import("@prisma/client").$Enums.ContactMethod;
        isEmailVerified: boolean;
    }>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        id: string;
        name: string;
        updatedAt: Date;
        email: string;
        phone: string | null;
        avatar: string | null;
        telegramContact: string | null;
        zaloContact: string | null;
        preferredContactMethod: import("@prisma/client").$Enums.ContactMethod;
    }>;
    getSubscription(userId: string): Promise<{
        hasActiveSubscription: boolean;
        subscription: null;
    } | {
        hasActiveSubscription: boolean;
        subscription: {
            licenseKey: string;
            package: {
                name: string;
                description: string | null;
                videosPerMonth: number;
                keywordsTracking: number;
                apiCallsPerMonth: number;
                maxDevices: number;
            };
            startDate: Date;
            endDate: Date;
            daysRemaining: number;
            maxDevices: number;
        };
    }>;
    getOrders(userId: string, page?: number, limit?: number): Promise<{
        orders: ({
            package: {
                name: string;
                durationMonths: number;
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
    getLicenses(userId: string): Promise<{
        id: string;
        licenseKey: string;
        package: {
            name: string;
            durationMonths: number;
        };
        status: import("@prisma/client").$Enums.LicenseStatus;
        startDate: Date;
        endDate: Date;
        maxDevices: number;
        activeDevices: number;
        createdAt: Date;
    }[]>;
    getLicenseDevices(userId: string, licenseId: string): Promise<{
        id: string;
        isActive: boolean;
        lastLoginAt: Date | null;
        activatedAt: Date;
        deviceName: string;
        deviceOS: string;
    }[]>;
}
