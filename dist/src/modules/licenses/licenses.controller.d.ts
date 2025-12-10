import { LicensesService } from './licenses.service';
export declare class LicensesController {
    private readonly licensesService;
    constructor(licensesService: LicensesService);
    validate(key: string): Promise<{
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
}
