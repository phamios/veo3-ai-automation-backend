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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const error_codes_1 = require("../../common/constants/error-codes");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                avatar: true,
                role: true,
                telegramContact: true,
                zaloContact: true,
                preferredContactMethod: true,
                isEmailVerified: true,
                createdAt: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.USER_NOT_FOUND,
                message: 'User not found',
            });
        }
        return user;
    }
    async updateProfile(userId, dto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: dto,
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                avatar: true,
                telegramContact: true,
                zaloContact: true,
                preferredContactMethod: true,
                updatedAt: true,
            },
        });
        return user;
    }
    async getSubscription(userId) {
        const license = await this.prisma.license.findFirst({
            where: {
                userId,
                status: 'ACTIVE',
                endDate: { gt: new Date() },
            },
            include: {
                package: {
                    select: {
                        name: true,
                        description: true,
                        videosPerMonth: true,
                        keywordsTracking: true,
                        apiCallsPerMonth: true,
                        maxDevices: true,
                    },
                },
            },
            orderBy: { endDate: 'desc' },
        });
        if (!license) {
            return { hasActiveSubscription: false, subscription: null };
        }
        const daysRemaining = Math.ceil((license.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return {
            hasActiveSubscription: true,
            subscription: {
                licenseKey: license.licenseKey,
                package: license.package,
                startDate: license.startDate,
                endDate: license.endDate,
                daysRemaining,
                maxDevices: license.maxDevices,
            },
        };
    }
    async getOrders(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where: { userId },
                include: {
                    package: {
                        select: { name: true, durationMonths: true },
                    },
                    license: {
                        select: { licenseKey: true, status: true, endDate: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.order.count({ where: { userId } }),
        ]);
        return {
            orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getLicenses(userId) {
        const licenses = await this.prisma.license.findMany({
            where: { userId },
            include: {
                package: {
                    select: { name: true, durationMonths: true },
                },
                _count: {
                    select: { devices: { where: { isActive: true } } },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return licenses.map((license) => ({
            id: license.id,
            licenseKey: license.licenseKey,
            package: license.package,
            status: license.status,
            startDate: license.startDate,
            endDate: license.endDate,
            maxDevices: license.maxDevices,
            activeDevices: license._count.devices,
            createdAt: license.createdAt,
        }));
    }
    async getLicenseDevices(userId, licenseId) {
        const license = await this.prisma.license.findFirst({
            where: { id: licenseId, userId },
        });
        if (!license) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.LICENSE_NOT_FOUND,
                message: 'License not found',
            });
        }
        const devices = await this.prisma.licenseDevice.findMany({
            where: { licenseId },
            select: {
                id: true,
                deviceName: true,
                deviceOS: true,
                isActive: true,
                activatedAt: true,
                lastLoginAt: true,
            },
            orderBy: { activatedAt: 'desc' },
        });
        return devices;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map