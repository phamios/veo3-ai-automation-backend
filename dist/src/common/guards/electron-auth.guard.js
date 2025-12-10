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
exports.ElectronAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const error_codes_1 = require("../constants/error-codes");
let ElectronAuthGuard = class ElectronAuthGuard {
    jwtService;
    configService;
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException({
                code: error_codes_1.ErrorCodes.AUTH_REQUIRED,
                message: 'Authorization header missing or invalid',
            });
        }
        const token = authHeader.substring(7);
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('ELECTRON_JWT_SECRET'),
            });
            request.electronUser = payload;
            return true;
        }
        catch {
            throw new common_1.UnauthorizedException({
                code: error_codes_1.ErrorCodes.INVALID_TOKEN,
                message: 'Invalid or expired token',
            });
        }
    }
};
exports.ElectronAuthGuard = ElectronAuthGuard;
exports.ElectronAuthGuard = ElectronAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], ElectronAuthGuard);
//# sourceMappingURL=electron-auth.guard.js.map