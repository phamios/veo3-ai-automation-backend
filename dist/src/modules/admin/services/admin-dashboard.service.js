"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminDashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let AdminDashboardService = class AdminDashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats() {
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - 7);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const [totalUsers, totalOrders, pendingOrders, processingOrders, completedOrders, rejectedOrders, expiredOrders, totalLicenses, activeLicenses, revenueToday, revenueWeek, revenueMonth,] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.order.count(),
            this.prisma.order.count({ where: { status: 'PENDING' } }),
            this.prisma.order.count({ where: { status: 'PROCESSING' } }),
            this.prisma.order.count({ where: { status: 'COMPLETED' } }),
            this.prisma.order.count({ where: { status: 'REJECTED' } }),
            this.prisma.order.count({ where: { status: 'EXPIRED' } }),
            this.prisma.license.count(),
            this.prisma.license.count({ where: { status: 'ACTIVE' } }),
            this.getRevenue(todayStart),
            this.getRevenue(weekStart),
            this.getRevenue(monthStart),
        ]);
        return {
            users: { total: totalUsers },
            orders: {
                total: totalOrders,
                pending: pendingOrders,
                processing: processingOrders,
                completed: completedOrders,
                rejected: rejectedOrders,
                expired: expiredOrders,
            },
            licenses: {
                total: totalLicenses,
                active: activeLicenses,
            },
            revenue: {
                today: revenueToday,
                week: revenueWeek,
                month: revenueMonth,
            },
        };
    }
    async getRevenue(since) {
        const result = await this.prisma.order.aggregate({
            where: {
                status: 'COMPLETED',
                approvedAt: { gte: since },
            },
            _sum: { amount: true },
        });
        return Number(result._sum.amount) || 0;
    }
};
exports.AdminDashboardService = AdminDashboardService;
exports.AdminDashboardService = AdminDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminDashboardService);
//# sourceMappingURL=admin-dashboard.service.js.map