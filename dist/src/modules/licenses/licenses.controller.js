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
exports.LicensesController = void 0;
const common_1 = require("@nestjs/common");
const licenses_service_1 = require("./licenses.service");
const decorators_1 = require("../../common/decorators");
let LicensesController = class LicensesController {
    licensesService;
    constructor(licensesService) {
        this.licensesService = licensesService;
    }
    async validate(key) {
        return this.licensesService.validateLicense(key);
    }
};
exports.LicensesController = LicensesController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)(':key/validate'),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LicensesController.prototype, "validate", null);
exports.LicensesController = LicensesController = __decorate([
    (0, common_1.Controller)('licenses'),
    __metadata("design:paramtypes", [licenses_service_1.LicensesService])
], LicensesController);
//# sourceMappingURL=licenses.controller.js.map