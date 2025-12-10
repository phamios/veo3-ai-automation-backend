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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElectronController = void 0;
const common_1 = require("@nestjs/common");
const electron_service_1 = require("./electron.service");
const decorators_1 = require("../../common/decorators");
const electron_auth_guard_1 = require("../../common/guards/electron-auth.guard");
const dto_1 = require("./dto");
let ElectronController = class ElectronController {
    electronService;
    constructor(electronService) {
        this.electronService = electronService;
    }
    async activate(dto, req) {
        const ip = req.ip || req.socket.remoteAddress;
        return this.electronService.activate(dto, ip);
    }
    async verify(req) {
        return this.electronService.verify(req.electronUser);
    }
    async refreshToken(req) {
        return this.electronService.refreshToken(req.electronUser);
    }
    async getLicenseInfo(req) {
        return this.electronService.getLicenseInfo(req.electronUser);
    }
    async getDevices(req) {
        return this.electronService.getDevices(req.electronUser);
    }
    async requestDeactivateOtp(req, dto) {
        return this.electronService.requestDeactivateOtp(req.electronUser, dto.deviceId);
    }
    async deactivateDevice(req, dto) {
        return this.electronService.deactivateDevice(req.electronUser, dto.deviceId, dto.otp, req.electronUser.hardwareId);
    }
    async logActivity(req, dto) {
        const ip = req.ip || req.socket.remoteAddress;
        return this.electronService.logActivity(req.electronUser, dto, ip);
    }
    async getUsageStats(req) {
        return this.electronService.getUsageStats(req.electronUser);
    }
    async checkLimit(req, dto) {
        return this.electronService.checkLimit(req.electronUser, dto);
    }
};
exports.ElectronController = ElectronController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('activate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ActivateLicenseDto, Object]),
    __metadata("design:returntype", Promise)
], ElectronController.prototype, "activate", null);
__decorate([
    (0, common_1.UseGuards)(electron_auth_guard_1.ElectronAuthGuard),
    (0, common_1.Post)('verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ElectronController.prototype, "verify", null);
__decorate([
    (0, common_1.UseGuards)(electron_auth_guard_1.ElectronAuthGuard),
    (0, common_1.Post)('refresh-token'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ElectronController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.UseGuards)(electron_auth_guard_1.ElectronAuthGuard),
    (0, common_1.Get)('license-info'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ElectronController.prototype, "getLicenseInfo", null);
__decorate([
    (0, common_1.UseGuards)(electron_auth_guard_1.ElectronAuthGuard),
    (0, common_1.Get)('devices'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ElectronController.prototype, "getDevices", null);
__decorate([
    (0, common_1.UseGuards)(electron_auth_guard_1.ElectronAuthGuard),
    (0, common_1.Post)('request-deactivate-otp'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.RequestOtpDto]),
    __metadata("design:returntype", Promise)
], ElectronController.prototype, "requestDeactivateOtp", null);
__decorate([
    (0, common_1.UseGuards)(electron_auth_guard_1.ElectronAuthGuard),
    (0, common_1.Post)('deactivate-device'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.DeactivateDeviceDto]),
    __metadata("design:returntype", Promise)
], ElectronController.prototype, "deactivateDevice", null);
__decorate([
    (0, common_1.UseGuards)(electron_auth_guard_1.ElectronAuthGuard),
    (0, common_1.Post)('log-activity'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.LogActivityDto]),
    __metadata("design:returntype", Promise)
], ElectronController.prototype, "logActivity", null);
__decorate([
    (0, common_1.UseGuards)(electron_auth_guard_1.ElectronAuthGuard),
    (0, common_1.Get)('usage-stats'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ElectronController.prototype, "getUsageStats", null);
__decorate([
    (0, common_1.UseGuards)(electron_auth_guard_1.ElectronAuthGuard),
    (0, common_1.Post)('check-limit'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CheckLimitDto]),
    __metadata("design:returntype", Promise)
], ElectronController.prototype, "checkLimit", null);
exports.ElectronController = ElectronController = __decorate([
    (0, common_1.Controller)('electron'),
    __metadata("design:paramtypes", [electron_service_1.ElectronService])
], ElectronController);
//# sourceMappingURL=electron.controller.js.map