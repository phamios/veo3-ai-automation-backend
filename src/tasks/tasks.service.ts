import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../modules/notifications/email.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredOrders() {
    this.logger.log('Checking for expired orders...');

    const result = await this.prisma.order.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });

    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} orders as expired`);
    }
  }

  @Cron('0 0 * * *') // Every day at midnight
  async handleExpiredLicenses() {
    this.logger.log('Checking for expired licenses...');

    const result = await this.prisma.license.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });

    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} licenses as expired`);
    }
  }

  @Cron('0 9 * * *') // Every day at 9:00 AM
  async handleExpirationReminders() {
    this.logger.log('Sending expiration reminders...');

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringLicenses = await this.prisma.license.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: new Date(),
          lte: sevenDaysFromNow,
        },
      },
      include: {
        user: { select: { email: true, name: true } },
        package: { select: { name: true } },
      },
    });

    for (const license of expiringLicenses) {
      const daysRemaining = Math.ceil(
        (license.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      await this.emailService.sendExpirationReminderEmail({
        to: license.user.email,
        userName: license.user.name,
        packageName: license.package.name,
        expiryDate: license.endDate,
        daysRemaining,
      });
    }

    if (expiringLicenses.length > 0) {
      this.logger.log(
        `Sent ${expiringLicenses.length} expiration reminder emails`,
      );
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredSessions() {
    this.logger.log('Cleaning up expired sessions...');

    const result = await this.prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    if (result.count > 0) {
      this.logger.log(`Deleted ${result.count} expired sessions`);
    }
  }

  @Cron('0 0 1 * *') // First day of every month at midnight
  async cleanupOldActivityLogs() {
    this.logger.log('Cleaning up old activity logs...');

    const retentionDays = 90; // 90 days retention as per user preference
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.activityLog.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });

    if (result.count > 0) {
      this.logger.log(`Deleted ${result.count} old activity logs`);
    }
  }
}
