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
exports.AdminUsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const error_codes_1 = require("../../../common/constants/error-codes");
let AdminUsersService = class AdminUsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { search, page = 1, limit = 10 } = params;
        const skip = (page - 1) * limit;
        const where = search
            ? {
                OR: [
                    { email: { contains: search, mode: 'insensitive' } },
                    { name: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {};
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    role: true,
                    isEmailVerified: true,
                    createdAt: true,
                    _count: { select: { orders: true, licenses: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            users,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
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
                lastLoginAt: true,
                lastLoginIp: true,
                createdAt: true,
                orders: {
                    select: {
                        id: true,
                        orderNumber: true,
                        status: true,
                        amount: true,
                        createdAt: true,
                        package: { select: { name: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                licenses: {
                    select: {
                        id: true,
                        licenseKey: true,
                        status: true,
                        startDate: true,
                        endDate: true,
                        package: { select: { name: true } },
                        _count: { select: { devices: { where: { isActive: true } } } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
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
    async update(id, data) {
        const user = await this.prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                isEmailVerified: true,
                updatedAt: true,
            },
        });
        return user;
    }
    async extendSubscription(userId, licenseId, months, adminId) {
        const license = await this.prisma.license.findFirst({
            where: { id: licenseId, userId },
        });
        if (!license) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.LICENSE_NOT_FOUND,
                message: 'License not found',
            });
        }
        const newEndDate = new Date(license.endDate);
        newEndDate.setMonth(newEndDate.getMonth() + months);
        const updatedLicense = await this.prisma.license.update({
            where: { id: licenseId },
            data: {
                endDate: newEndDate,
                durationMonths: license.durationMonths + months,
                status: 'ACTIVE',
            },
        });
        await this.prisma.activityLog.create({
            data: {
                userId,
                licenseId,
                actionType: 'license_extended',
                actionDetail: {
                    extendedBy: adminId,
                    monthsAdded: months,
                    newEndDate: newEndDate.toISOString(),
                },
            },
        });
        return updatedLicense;
    }
};
exports.AdminUsersService = AdminUsersService;
exports.AdminUsersService = AdminUsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminUsersService);
//# sourceMappingURL=admin-users.service.js.map