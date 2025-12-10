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
exports.AdminLicensesController = void 0;
const common_1 = require("@nestjs/common");
const admin_licenses_service_1 = require("../services/admin-licenses.service");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const decorators_1 = require("../../../common/decorators");
const roles_enum_1 = require("../../../common/constants/roles.enum");
class GenerateLicenseDto {
    userId;
    packageId;
    maxDevices;
}
class UpdateLicenseDto {
    maxDevices;
    endDate;
    status;
}
class RevokeLicenseDto {
    reason;
}
let AdminLicensesController = class AdminLicensesController {
    licensesService;
    constructor(licensesService) {
        this.licensesService = licensesService;
    }
    async findAll(status, search, page, limit) {
        return this.licensesService.findAll({ status, search, page, limit });
    }
    async findOne(id) {
        return this.licensesService.findOne(id);
    }
    async generate(admin, dto) {
        return this.licensesService.generate({
            ...dto,
            adminId: admin.id,
        });
    }
    async update(id, dto) {
        return this.licensesService.update(id, dto);
    }
    async revoke(id, dto) {
        return this.licensesService.revoke(id, dto.reason);
    }
    async getDevices(id) {
        return this.licensesService.getDevices(id);
    }
    async removeDevice(licenseId, deviceId) {
        return this.licensesService.removeDevice(licenseId, deviceId);
    }
    async resetAllDevices(id) {
        return this.licensesService.resetAllDevices(id);
    }
};
exports.AdminLicensesController = AdminLicensesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(10), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], AdminLicensesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminLicensesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('generate'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, GenerateLicenseDto]),
    __metadata("design:returntype", Promise)
], AdminLicensesController.prototype, "generate", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateLicenseDto]),
    __metadata("design:returntype", Promise)
], AdminLicensesController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/revoke'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, RevokeLicenseDto]),
    __metadata("design:returntype", Promise)
], AdminLicensesController.prototype, "revoke", null);
__decorate([
    (0, common_1.Get)(':id/devices'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminLicensesController.prototype, "getDevices", null);
__decorate([
    (0, common_1.Delete)(':id/devices/:deviceId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminLicensesController.prototype, "removeDevice", null);
__decorate([
    (0, common_1.Put)(':id/reset-devices'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminLicensesController.prototype, "resetAllDevices", null);
exports.AdminLicensesController = AdminLicensesController = __decorate([
    (0, common_1.Controller)('admin/licenses'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)(roles_enum_1.Role.ADMIN),
    __metadata("design:paramtypes", [admin_licenses_service_1.AdminLicensesService])
], AdminLicensesController);
//# sourceMappingURL=admin-licenses.controller.js.map