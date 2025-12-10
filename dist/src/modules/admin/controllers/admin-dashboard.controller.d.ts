import { AdminDashboardService } from '../services/admin-dashboard.service';
export declare class AdminDashboardController {
    private readonly dashboardService;
    constructor(dashboardService: AdminDashboardService);
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
}
