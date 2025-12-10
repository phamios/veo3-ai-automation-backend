import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
interface AuthenticatedUser {
    id: string;
    email: string;
    name: string;
    role: string;
}
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(user: AuthenticatedUser): Promise<{
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
    updateProfile(user: AuthenticatedUser, dto: UpdateProfileDto): Promise<{
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
    getSubscription(user: AuthenticatedUser): Promise<{
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
    getOrders(user: AuthenticatedUser, page: number, limit: number): Promise<{
        orders: ({
            package: {
                name: string;
                durationMonths: number;
            };
            license: {
                licenseKey: string;
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
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getLicenses(user: AuthenticatedUser): Promise<{
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
    getLicenseDevices(user: AuthenticatedUser, licenseId: string): Promise<{
        id: string;
        isActive: boolean;
        lastLoginAt: Date | null;
        activatedAt: Date;
        deviceName: string;
        deviceOS: string;
    }[]>;
}
export {};
