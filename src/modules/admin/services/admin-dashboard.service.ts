import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalOrders,
      pendingOrders,
      processingOrders,
      completedOrders,
      rejectedOrders,
      expiredOrders,
      totalLicenses,
      activeLicenses,
      revenueToday,
      revenueWeek,
      revenueMonth,
    ] = await Promise.all([
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

  private async getRevenue(since: Date): Promise<number> {
    const result = await this.prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
        approvedAt: { gte: since },
      },
      _sum: { amount: true },
    });
    return Number(result._sum.amount) || 0;
  }
}
