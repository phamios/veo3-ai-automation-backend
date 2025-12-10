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
exports.AdminOrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const licenses_service_1 = require("../../licenses/licenses.service");
const telegram_service_1 = require("../../notifications/telegram.service");
const email_service_1 = require("../../notifications/email.service");
const error_codes_1 = require("../../../common/constants/error-codes");
let AdminOrdersService = class AdminOrdersService {
    prisma;
    licensesService;
    telegramService;
    emailService;
    constructor(prisma, licensesService, telegramService, emailService) {
        this.prisma = prisma;
        this.licensesService = licensesService;
        this.telegramService = telegramService;
        this.emailService = emailService;
    }
    async findAll(params) {
        const { status, search, page = 1, limit = 10 } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (status) {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
            ];
        }
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    package: { select: { name: true, durationMonths: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.order.count({ where }),
        ]);
        return {
            orders,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
                package: true,
                license: { include: { devices: true } },
                approvedBy: { select: { name: true, email: true } },
                rejectedBy: { select: { name: true, email: true } },
            },
        });
        if (!order) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.ORDER_NOT_FOUND,
                message: 'Order not found',
            });
        }
        return order;
    }
    async approve(orderId, adminId, dto) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: true,
                package: true,
            },
        });
        if (!order) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.ORDER_NOT_FOUND,
                message: 'Order not found',
            });
        }
        if (order.status !== 'PROCESSING') {
            throw new common_1.BadRequestException({
                code: error_codes_1.ErrorCodes.INVALID_ORDER_STATUS,
                message: `Cannot approve order with status: ${order.status}`,
            });
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const license = await this.licensesService.create({
                userId: order.userId,
                orderId: order.id,
                packageId: order.packageId,
                maxDevices: dto.maxDevices,
            }, adminId);
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'COMPLETED',
                    approvedAt: new Date(),
                    approvedById: adminId,
                    licenseId: license.id,
                    deliveryMethod: dto.deliveryMethod || order.user.preferredContactMethod,
                    deliveryContact: dto.deliveryContact ||
                        this.getDeliveryContact(order.user, dto.deliveryMethod || order.user.preferredContactMethod),
                    deliveredAt: new Date(),
                    adminNotes: dto.adminNotes,
                },
                include: {
                    user: { select: { name: true, email: true } },
                    package: { select: { name: true } },
                    license: { select: { licenseKey: true, endDate: true } },
                },
            });
            return { order: updatedOrder, license };
        });
        await this.emailService.sendLicenseEmail({
            to: order.user.email,
            userName: order.user.name,
            licenseKey: result.license.licenseKey,
            packageName: order.package.name,
            expiryDate: result.license.endDate,
        });
        await this.telegramService.sendOrderApprovedNotification({
            orderNumber: order.orderNumber,
            userName: order.user.name,
            licenseKey: result.license.licenseKey,
            approvedBy: adminId,
        });
        return result.order;
    }
    async reject(orderId, adminId, dto) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { user: true },
        });
        if (!order) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.ORDER_NOT_FOUND,
                message: 'Order not found',
            });
        }
        if (order.status !== 'PROCESSING') {
            throw new common_1.BadRequestException({
                code: error_codes_1.ErrorCodes.INVALID_ORDER_STATUS,
                message: `Cannot reject order with status: ${order.status}`,
            });
        }
        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'REJECTED',
                rejectedAt: new Date(),
                rejectedById: adminId,
                rejectionReason: dto.reason,
            },
            include: {
                user: { select: { name: true, email: true } },
                package: { select: { name: true } },
            },
        });
        await this.telegramService.sendOrderRejectedNotification({
            orderNumber: order.orderNumber,
            userName: order.user.name,
            reason: dto.reason,
            rejectedBy: adminId,
        });
        return updatedOrder;
    }
    getDeliveryContact(user, method) {
        switch (method) {
            case 'TELEGRAM':
                return user.telegramContact || user.email;
            case 'ZALO':
                return user.zaloContact || user.email;
            default:
                return user.email;
        }
    }
};
exports.AdminOrdersService = AdminOrdersService;
exports.AdminOrdersService = AdminOrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        licenses_service_1.LicensesService,
        telegram_service_1.TelegramService,
        email_service_1.EmailService])
], AdminOrdersService);
//# sourceMappingURL=admin-orders.service.js.map