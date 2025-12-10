import { PrismaService } from '../../../prisma/prisma.service';
export declare class AdminDashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getStats(): Promise<{
        users: {
            total: number;
        };
        orders: {
            total: number;
            pending: number;
            processing: number;
            completed: number;
            rejected: number;
            expired: number;
        };
        licenses: {
            total: number;
            active: number;
        };
        revenue: {
            today: number;
            week: number;
            month: number;
        };
    }>;
    private getRevenue;
}
