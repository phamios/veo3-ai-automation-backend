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
exports.AdminLicensesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const licenses_service_1 = require("../../licenses/licenses.service");
const error_codes_1 = require("../../../common/constants/error-codes");
let AdminLicensesService = class AdminLicensesService {
    prisma;
    licensesService;
    constructor(prisma, licensesService) {
        this.prisma = prisma;
        this.licensesService = licensesService;
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
                { licenseKey: { contains: search, mode: 'insensitive' } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
            ];
        }
        const [licenses, total] = await Promise.all([
            this.prisma.license.findMany({
                where,
                include: {
                    user: { select: { name: true, email: true } },
                    package: { select: { name: true } },
                    _count: { select: { devices: { where: { isActive: true } } } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.license.count({ where }),
        ]);
        return {
            licenses,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id) {
        const license = await this.prisma.license.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, email: true } },
                package: true,
                order: { select: { orderNumber: true, amount: true } },
                createdBy: { select: { name: true, email: true } },
                devices: {
                    orderBy: { activatedAt: 'desc' },
                },
            },
        });
        if (!license) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.LICENSE_NOT_FOUND,
                message: 'License not found',
            });
        }
        return license;
    }
    async generate(params) {
        const pkg = await this.prisma.package.findUnique({
            where: { id: params.packageId },
        });
        if (!pkg) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.PACKAGE_NOT_FOUND,
                message: 'Package not found',
            });
        }
        const order = await this.prisma.order.create({
            data: {
                orderNumber: `MANUAL-${Date.now()}`,
                userId: params.userId,
                packageId: params.packageId,
                amount: 0,
                transferContent: `MANUAL-${Date.now()}`,
                status: 'COMPLETED',
                approvedAt: new Date(),
                approvedById: params.adminId,
                expiresAt: new Date(),
                adminNotes: 'Manually generated license',
            },
        });
        return this.licensesService.create({
            userId: params.userId,
            orderId: order.id,
            packageId: params.packageId,
            maxDevices: params.maxDevices,
        }, params.adminId);
    }
    async update(id, data) {
        return this.prisma.license.update({
            where: { id },
            data,
            include: {
                user: { select: { name: true, email: true } },
                package: { select: { name: true } },
            },
        });
    }
    async revoke(id, reason) {
        return this.licensesService.revoke(id, reason);
    }
    async getDevices(licenseId) {
        return this.prisma.licenseDevice.findMany({
            where: { licenseId },
            orderBy: { activatedAt: 'desc' },
        });
    }
    async removeDevice(licenseId, deviceId) {
        const device = await this.prisma.licenseDevice.findFirst({
            where: { id: deviceId, licenseId },
        });
        if (!device) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.DEVICE_NOT_FOUND,
                message: 'Device not found',
            });
        }
        return this.licensesService.removeDevice(deviceId, 'Admin removed');
    }
    async resetAllDevices(licenseId) {
        await this.prisma.licenseDevice.updateMany({
            where: { licenseId, isActive: true },
            data: {
                isActive: false,
                deactivatedAt: new Date(),
                deactivatedReason: 'Admin reset all devices',
            },
        });
        return { message: 'All devices have been deactivated' };
    }
};
exports.AdminLicensesService = AdminLicensesService;
exports.AdminLicensesService = AdminLicensesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        licenses_service_1.LicensesService])
], AdminLicensesService);
//# sourceMappingURL=admin-licenses.service.js.map