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
exports.ElectronService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const email_service_1 = require("../notifications/email.service");
const error_codes_1 = require("../../common/constants/error-codes");
const utils_1 = require("../../utils");
let ElectronService = class ElectronService {
    prisma;
    redis;
    jwtService;
    configService;
    emailService;
    constructor(prisma, redis, jwtService, configService, emailService) {
        this.prisma = prisma;
        this.redis = redis;
        this.jwtService = jwtService;
        this.configService = configService;
        this.emailService = emailService;
    }
    async activate(dto, ipAddress) {
        const license = await this.prisma.license.findUnique({
            where: { licenseKey: dto.licenseKey },
            include: {
                package: true,
                user: { select: { id: true, name: true, email: true } },
                devices: { where: { isActive: true } },
            },
        });
        if (!license) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.LICENSE_NOT_FOUND,
                message: 'License key not found',
            });
        }
        if (license.status === 'REVOKED') {
            throw new common_1.ForbiddenException({
                code: error_codes_1.ErrorCodes.LICENSE_REVOKED,
                message: 'This license has been revoked',
            });
        }
        if (license.endDate < new Date()) {
            throw new common_1.ForbiddenException({
                code: error_codes_1.ErrorCodes.LICENSE_EXPIRED,
                message: 'This license has expired',
            });
        }
        const existingDevice = license.devices.find((d) => d.hardwareId === dto.hardwareId);
        if (existingDevice) {
            await this.prisma.licenseDevice.update({
                where: { id: existingDevice.id },
                data: { lastLoginAt: new Date(), ipAddress },
            });
            const token = this.generateElectronToken({
                licenseId: license.id,
                hardwareId: dto.hardwareId,
                userId: license.userId,
            });
            return {
                token,
                license: this.formatLicenseResponse(license),
                device: existingDevice,
                message: 'Device already activated',
            };
        }
        const activeDeviceCount = license.devices.length;
        if (activeDeviceCount >= license.maxDevices) {
            throw new common_1.ForbiddenException({
                code: error_codes_1.ErrorCodes.DEVICE_LIMIT_REACHED,
                message: `Device limit reached: ${activeDeviceCount}/${license.maxDevices} devices used`,
            });
        }
        const newDevice = await this.prisma.licenseDevice.create({
            data: {
                licenseId: license.id,
                hardwareId: dto.hardwareId,
                deviceName: dto.deviceName,
                deviceOS: dto.deviceOS,
                ipAddress,
            },
        });
        if (license.status === 'UNUSED') {
            await this.prisma.license.update({
                where: { id: license.id },
                data: { status: 'ACTIVE', activatedAt: new Date() },
            });
        }
        const token = this.generateElectronToken({
            licenseId: license.id,
            hardwareId: dto.hardwareId,
            userId: license.userId,
        });
        return {
            token,
            license: this.formatLicenseResponse(license),
            device: newDevice,
            message: 'Device activated successfully',
        };
    }
    async verify(payload) {
        const license = await this.prisma.license.findUnique({
            where: { id: payload.licenseId },
            include: {
                package: true,
                devices: { where: { hardwareId: payload.hardwareId, isActive: true } },
            },
        });
        if (!license) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.LICENSE_NOT_FOUND,
                message: 'License not found',
            });
        }
        if (license.status === 'REVOKED') {
            throw new common_1.ForbiddenException({
                code: error_codes_1.ErrorCodes.LICENSE_REVOKED,
                message: 'License has been revoked',
            });
        }
        if (license.endDate < new Date()) {
            throw new common_1.ForbiddenException({
                code: error_codes_1.ErrorCodes.LICENSE_EXPIRED,
                message: 'License has expired',
            });
        }
        if (license.devices.length === 0) {
            throw new common_1.ForbiddenException({
                code: error_codes_1.ErrorCodes.DEVICE_NOT_FOUND,
                message: 'Device not registered or has been deactivated',
            });
        }
        const daysRemaining = Math.ceil((license.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return {
            valid: true,
            license: this.formatLicenseResponse(license),
            daysRemaining,
        };
    }
    async refreshToken(payload) {
        await this.verify(payload);
        return {
            token: this.generateElectronToken(payload),
        };
    }
    async getDevices(payload) {
        const devices = await this.prisma.licenseDevice.findMany({
            where: { licenseId: payload.licenseId },
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
        return {
            devices,
            currentDevice: payload.hardwareId,
        };
    }
    async requestDeactivateOtp(payload, deviceId) {
        const device = await this.prisma.licenseDevice.findFirst({
            where: { id: deviceId, licenseId: payload.licenseId },
            include: {
                license: {
                    include: { user: { select: { email: true, name: true } } },
                },
            },
        });
        if (!device) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.DEVICE_NOT_FOUND,
                message: 'Device not found',
            });
        }
        const otp = (0, utils_1.generateOtp)();
        const otpExpireMinutes = this.configService.get('OTP_EXPIRES_MINUTES', 10);
        const otpKey = `deactivate_otp:${payload.licenseId}:${deviceId}`;
        await this.redis.setex(otpKey, otpExpireMinutes * 60, otp);
        await this.emailService.sendOtpEmail({
            to: device.license.user.email,
            userName: device.license.user.name,
            otp,
            deviceName: device.deviceName,
        });
        return {
            message: 'OTP sent to your registered email',
            expiresIn: otpExpireMinutes * 60,
        };
    }
    async deactivateDevice(payload, deviceId, otp, currentHardwareId) {
        const device = await this.prisma.licenseDevice.findFirst({
            where: { id: deviceId, licenseId: payload.licenseId },
        });
        if (!device) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.DEVICE_NOT_FOUND,
                message: 'Device not found',
            });
        }
        if (device.hardwareId === currentHardwareId) {
            throw new common_1.BadRequestException({
                code: error_codes_1.ErrorCodes.CANNOT_DEACTIVATE_CURRENT_DEVICE,
                message: 'Cannot deactivate the current device',
            });
        }
        const otpKey = `deactivate_otp:${payload.licenseId}:${deviceId}`;
        const storedOtp = await this.redis.get(otpKey);
        if (!storedOtp) {
            throw new common_1.BadRequestException({
                code: error_codes_1.ErrorCodes.OTP_EXPIRED,
                message: 'OTP has expired or was not requested',
            });
        }
        if (storedOtp !== otp) {
            throw new common_1.BadRequestException({
                code: error_codes_1.ErrorCodes.INVALID_OTP,
                message: 'Invalid OTP',
            });
        }
        await this.prisma.licenseDevice.update({
            where: { id: deviceId },
            data: {
                isActive: false,
                deactivatedAt: new Date(),
                deactivatedReason: 'User requested via OTP',
            },
        });
        await this.redis.del(otpKey);
        return { message: 'Device deactivated successfully' };
    }
    async getLicenseInfo(payload) {
        const license = await this.prisma.license.findUnique({
            where: { id: payload.licenseId },
            include: {
                package: true,
                devices: { where: { isActive: true } },
            },
        });
        if (!license) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.LICENSE_NOT_FOUND,
                message: 'License not found',
            });
        }
        const daysRemaining = Math.ceil((license.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return {
            license: {
                id: license.id,
                licenseKey: license.licenseKey,
                status: license.status,
                startDate: license.startDate,
                endDate: license.endDate,
                daysRemaining,
            },
            package: {
                name: license.package.name,
                videosPerMonth: license.package.videosPerMonth,
                keywordsTracking: license.package.keywordsTracking,
                apiCallsPerMonth: license.package.apiCallsPerMonth,
            },
            devices: {
                active: license.devices.length,
                max: license.maxDevices,
            },
        };
    }
    async logActivity(payload, dto, ipAddress) {
        await this.prisma.activityLog.create({
            data: {
                userId: payload.userId,
                licenseId: payload.licenseId,
                actionType: dto.actionType,
                actionDetail: dto.actionDetail,
                ipAddress,
            },
        });
        return { logged: true };
    }
    async getUsageStats(payload) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const license = await this.prisma.license.findUnique({
            where: { id: payload.licenseId },
            include: { package: true },
        });
        if (!license) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.LICENSE_NOT_FOUND,
                message: 'License not found',
            });
        }
        const usageStats = await this.prisma.activityLog.groupBy({
            by: ['actionType'],
            where: {
                licenseId: payload.licenseId,
                createdAt: { gte: startOfMonth },
            },
            _count: { actionType: true },
        });
        const usage = {};
        usageStats.forEach((stat) => {
            usage[stat.actionType] = stat._count.actionType;
        });
        return {
            usage,
            limits: {
                videosPerMonth: license.package.videosPerMonth,
                keywordsTracking: license.package.keywordsTracking,
                apiCallsPerMonth: license.package.apiCallsPerMonth,
            },
            periodStart: startOfMonth,
        };
    }
    async checkLimit(payload, dto) {
        const stats = await this.getUsageStats(payload);
        const currentUsage = stats.usage[dto.actionType] || 0;
        let limit = 0;
        switch (dto.actionType) {
            case 'video_create':
                limit = stats.limits.videosPerMonth;
                break;
            case 'keyword_track':
                limit = stats.limits.keywordsTracking;
                break;
            case 'api_call':
                limit = stats.limits.apiCallsPerMonth;
                break;
            default:
                return { canProceed: true, remaining: -1 };
        }
        if (limit === 0) {
            return { canProceed: true, remaining: -1 };
        }
        const remaining = limit - currentUsage;
        return {
            canProceed: remaining > 0,
            remaining: Math.max(0, remaining),
            limit,
            used: currentUsage,
        };
    }
    generateElectronToken(payload) {
        return this.jwtService.sign(payload, {
            secret: this.configService.get('ELECTRON_JWT_SECRET'),
            expiresIn: this.configService.get('ELECTRON_JWT_EXPIRES_IN_SECONDS', 86400),
        });
    }
    formatLicenseResponse(license) {
        return {
            id: license.id,
            licenseKey: license.licenseKey,
            status: license.status,
            startDate: license.startDate,
            endDate: license.endDate,
            maxDevices: license.maxDevices,
            package: {
                name: license.package.name,
                videosPerMonth: license.package.videosPerMonth,
                keywordsTracking: license.package.keywordsTracking,
                apiCallsPerMonth: license.package.apiCallsPerMonth,
            },
        };
    }
};
exports.ElectronService = ElectronService;
exports.ElectronService = ElectronService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        jwt_1.JwtService,
        config_1.ConfigService,
        email_service_1.EmailService])
], ElectronService);
//# sourceMappingURL=electron.service.js.map