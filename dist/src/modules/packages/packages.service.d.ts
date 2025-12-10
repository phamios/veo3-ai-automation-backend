import { PrismaService } from '../../prisma/prisma.service';
export declare class PackagesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
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
    }[]>;
    findOne(idOrSlug: string): Promise<{
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
    }>;
}
