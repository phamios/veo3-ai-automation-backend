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
exports.LicensesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const error_codes_1 = require("../../common/constants/error-codes");
const utils_1 = require("../../utils");
let LicensesService = class LicensesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateKey() {
        let key = (0, utils_1.generateLicenseKey)();
        let exists = await this.prisma.license.findUnique({
            where: { licenseKey: key },
        });
        while (exists) {
            key = (0, utils_1.generateLicenseKey)();
            exists = await this.prisma.license.findUnique({
                where: { licenseKey: key },
            });
        }
        return key;
    }
    async create(dto, createdById) {
        const pkg = await this.prisma.package.findUnique({
            where: { id: dto.packageId },
        });
        if (!pkg) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.PACKAGE_NOT_FOUND,
                message: 'Package not found',
            });
        }
        const licenseKey = await this.generateKey();
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + pkg.durationMonths);
        const license = await this.prisma.license.create({
            data: {
                licenseKey,
                userId: dto.userId,
                orderId: dto.orderId,
                packageId: dto.packageId,
                startDate,
                endDate,
                durationMonths: pkg.durationMonths,
                status: 'ACTIVE',
                activatedAt: new Date(),
                maxDevices: dto.maxDevices || pkg.maxDevices,
                appDownloadLink: dto.appDownloadLink,
                appVersion: dto.appVersion,
                createdById,
            },
            include: {
                package: {
                    select: { name: true, durationMonths: true },
                },
                user: {
                    select: { name: true, email: true },
                },
            },
        });
        return license;
    }
    async findByKey(licenseKey) {
        if (!(0, utils_1.isValidLicenseKeyFormat)(licenseKey)) {
            throw new common_1.BadRequestException({
                code: error_codes_1.ErrorCodes.LICENSE_INVALID,
                message: 'Invalid license key format',
            });
        }
        const license = await this.prisma.license.findUnique({
            where: { licenseKey },
            include: {
                package: true,
                user: {
                    select: { id: true, name: true, email: true },
                },
                devices: {
                    where: { isActive: true },
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
    async validateLicense(licenseKey) {
        const license = await this.findByKey(licenseKey);
        if (license.status === 'REVOKED') {
            throw new common_1.BadRequestException({
                code: error_codes_1.ErrorCodes.LICENSE_REVOKED,
                message: 'License has been revoked',
            });
        }
        if (license.status === 'EXPIRED' || license.endDate < new Date()) {
            throw new common_1.BadRequestException({
                code: error_codes_1.ErrorCodes.LICENSE_EXPIRED,
                message: 'License has expired',
            });
        }
        return {
            valid: true,
            license: {
                id: license.id,
                licenseKey: license.licenseKey,
                status: license.status,
                maxDevices: license.maxDevices,
                activeDevices: license.devices.length,
                startDate: license.startDate,
                endDate: license.endDate,
                package: license.package,
            },
        };
    }
    async getDeviceCount(licenseId) {
        return this.prisma.licenseDevice.count({
            where: { licenseId, isActive: true },
        });
    }
    async addDevice(licenseId, deviceData) {
        const existingDevice = await this.prisma.licenseDevice.findUnique({
            where: {
                licenseId_hardwareId: {
                    licenseId,
                    hardwareId: deviceData.hardwareId,
                },
            },
        });
        if (existingDevice) {
            if (!existingDevice.isActive) {
                return this.prisma.licenseDevice.update({
                    where: { id: existingDevice.id },
                    data: {
                        isActive: true,
                        activatedAt: new Date(),
                        lastLoginAt: new Date(),
                        deactivatedAt: null,
                        deactivatedReason: null,
                    },
                });
            }
            return this.prisma.licenseDevice.update({
                where: { id: existingDevice.id },
                data: { lastLoginAt: new Date(), ipAddress: deviceData.ipAddress },
            });
        }
        return this.prisma.licenseDevice.create({
            data: {
                licenseId,
                ...deviceData,
            },
        });
    }
    async removeDevice(deviceId, reason) {
        const device = await this.prisma.licenseDevice.findUnique({
            where: { id: deviceId },
        });
        if (!device) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.DEVICE_NOT_FOUND,
                message: 'Device not found',
            });
        }
        return this.prisma.licenseDevice.update({
            where: { id: deviceId },
            data: {
                isActive: false,
                deactivatedAt: new Date(),
                deactivatedReason: reason || 'User requested',
            },
        });
    }
    async revoke(licenseId, reason) {
        const license = await this.prisma.license.findUnique({
            where: { id: licenseId },
        });
        if (!license) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.LICENSE_NOT_FOUND,
                message: 'License not found',
            });
        }
        return this.prisma.license.update({
            where: { id: licenseId },
            data: {
                status: 'REVOKED',
                revokedAt: new Date(),
                revokedReason: reason,
            },
        });
    }
};
exports.LicensesService = LicensesService;
exports.LicensesService = LicensesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LicensesService);
//# sourceMappingURL=licenses.service.js.map