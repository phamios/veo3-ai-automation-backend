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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const telegram_service_1 = require("../notifications/telegram.service");
const error_codes_1 = require("../../common/constants/error-codes");
const utils_1 = require("../../utils");
let OrdersService = class OrdersService {
    prisma;
    telegramService;
    constructor(prisma, telegramService) {
        this.prisma = prisma;
        this.telegramService = telegramService;
    }
    async create(userId, dto) {
        const pkg = await this.prisma.package.findUnique({
            where: { id: dto.packageId },
        });
        if (!pkg) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.PACKAGE_NOT_FOUND,
                message: 'Package not found',
            });
        }
        if (!pkg.isActive) {
            throw new common_1.BadRequestException({
                code: error_codes_1.ErrorCodes.PACKAGE_INACTIVE,
                message: 'Package is not available',
            });
        }
        let orderNumber = (0, utils_1.generateOrderNumber)();
        let transferContent = (0, utils_1.generateTransferContent)();
        let existingOrder = await this.prisma.order.findFirst({
            where: { OR: [{ orderNumber }, { transferContent }] },
        });
        while (existingOrder) {
            orderNumber = (0, utils_1.generateOrderNumber)();
            transferContent = (0, utils_1.generateTransferContent)();
            existingOrder = await this.prisma.order.findFirst({
                where: { OR: [{ orderNumber }, { transferContent }] },
            });
        }
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const order = await this.prisma.order.create({
            data: {
                orderNumber,
                userId,
                packageId: dto.packageId,
                amount: pkg.salePrice,
                paymentMethod: dto.paymentMethod,
                transferContent,
                deliveryMethod: dto.deliveryMethod,
                deliveryContact: dto.deliveryContact,
                expiresAt,
            },
            include: {
                package: {
                    select: {
                        name: true,
                        durationMonths: true,
                        salePrice: true,
                    },
                },
            },
        });
        return {
            order,
            payment: {
                transferContent,
                amount: pkg.salePrice,
                expiresAt,
            },
        };
    }
    async findOne(userId, orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                package: {
                    select: {
                        name: true,
                        durationMonths: true,
                        salePrice: true,
                        originalPrice: true,
                        discountPercent: true,
                    },
                },
                license: {
                    select: {
                        licenseKey: true,
                        status: true,
                        startDate: true,
                        endDate: true,
                    },
                },
            },
        });
        if (!order) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.ORDER_NOT_FOUND,
                message: 'Order not found',
            });
        }
        if (order.userId !== userId) {
            throw new common_1.ForbiddenException({
                code: error_codes_1.ErrorCodes.FORBIDDEN,
                message: 'Access denied',
            });
        }
        return order;
    }
    async confirm(userId, orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });
        if (!order) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.ORDER_NOT_FOUND,
                message: 'Order not found',
            });
        }
        if (order.userId !== userId) {
            throw new common_1.ForbiddenException({
                code: error_codes_1.ErrorCodes.FORBIDDEN,
                message: 'Access denied',
            });
        }
        if (order.status !== 'PENDING') {
            throw new common_1.BadRequestException({
                code: error_codes_1.ErrorCodes.INVALID_ORDER_STATUS,
                message: `Cannot confirm order with status: ${order.status}`,
            });
        }
        if (order.expiresAt < new Date()) {
            throw new common_1.BadRequestException({
                code: error_codes_1.ErrorCodes.ORDER_EXPIRED,
                message: 'Order has expired',
            });
        }
        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'PROCESSING',
                userConfirmedAt: new Date(),
            },
            include: {
                package: {
                    select: { name: true, salePrice: true },
                },
                user: {
                    select: { name: true, email: true },
                },
            },
        });
        await this.telegramService.sendNewOrderNotification({
            orderId: updatedOrder.id,
            orderNumber: updatedOrder.orderNumber,
            userName: updatedOrder.user?.name || 'Unknown',
            userEmail: updatedOrder.user?.email || 'Unknown',
            packageName: updatedOrder.package?.name || 'Unknown',
            amount: Number(updatedOrder.amount),
            transferContent: updatedOrder.transferContent,
            createdAt: updatedOrder.createdAt,
        });
        return updatedOrder;
    }
    async getStatus(userId, orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                orderNumber: true,
                status: true,
                createdAt: true,
                userConfirmedAt: true,
                approvedAt: true,
                rejectedAt: true,
                rejectionReason: true,
                license: {
                    select: {
                        licenseKey: true,
                        status: true,
                    },
                },
            },
        });
        if (!order) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.ORDER_NOT_FOUND,
                message: 'Order not found',
            });
        }
        const fullOrder = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: { userId: true },
        });
        if (fullOrder?.userId !== userId) {
            throw new common_1.ForbiddenException({
                code: error_codes_1.ErrorCodes.FORBIDDEN,
                message: 'Access denied',
            });
        }
        return order;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        telegram_service_1.TelegramService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map