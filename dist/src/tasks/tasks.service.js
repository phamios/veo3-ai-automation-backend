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
var TasksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../modules/notifications/email.service");
let TasksService = TasksService_1 = class TasksService {
    prisma;
    emailService;
    logger = new common_1.Logger(TasksService_1.name);
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
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
            const daysRemaining = Math.ceil((license.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            await this.emailService.sendExpirationReminderEmail({
                to: license.user.email,
                userName: license.user.name,
                packageName: license.package.name,
                expiryDate: license.endDate,
                daysRemaining,
            });
        }
        if (expiringLicenses.length > 0) {
            this.logger.log(`Sent ${expiringLicenses.length} expiration reminder emails`);
        }
    }
    async cleanupExpiredSessions() {
        this.logger.log('Cleaning up expired sessions...');
        const result = await this.prisma.session.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        });
        if (result.count > 0) {
            this.logger.log(`Deleted ${result.count} expired sessions`);
        }
    }
    async cleanupOldActivityLogs() {
        this.logger.log('Cleaning up old activity logs...');
        const retentionDays = 90;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        const result = await this.prisma.activityLog.deleteMany({
            where: { createdAt: { lt: cutoffDate } },
        });
        if (result.count > 0) {
            this.logger.log(`Deleted ${result.count} old activity logs`);
        }
    }
};
exports.TasksService = TasksService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TasksService.prototype, "handleExpiredOrders", null);
__decorate([
    (0, schedule_1.Cron)('0 0 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TasksService.prototype, "handleExpiredLicenses", null);
__decorate([
    (0, schedule_1.Cron)('0 9 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TasksService.prototype, "handleExpirationReminders", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TasksService.prototype, "cleanupExpiredSessions", null);
__decorate([
    (0, schedule_1.Cron)('0 0 1 * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TasksService.prototype, "cleanupOldActivityLogs", null);
exports.TasksService = TasksService = TasksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map