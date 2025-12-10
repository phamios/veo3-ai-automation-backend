"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const QRCode = __importStar(require("qrcode"));
let PaymentsService = class PaymentsService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    getMethods() {
        return [
            {
                id: 'VND_BANK_TRANSFER',
                name: 'Bank Transfer (VND)',
                label: 'Chuyển khoản ngân hàng',
                enabled: true,
                description: 'Transfer via Vietnamese bank account',
            },
            {
                id: 'USDT',
                name: 'USDT (Crypto)',
                label: 'Coming Soon',
                enabled: false,
                description: 'Pay with USDT cryptocurrency',
            },
        ];
    }
    getBankInfo() {
        return {
            bankId: this.configService.get('BANK_ID', '970436'),
            bankName: this.configService.get('BANK_NAME', 'Vietcombank'),
            accountNumber: this.configService.get('BANK_ACCOUNT'),
            accountName: this.configService.get('BANK_ACCOUNT_NAME'),
        };
    }
    async generateQR(params) {
        const bankInfo = this.getBankInfo();
        const vietQRUrl = this.buildVietQRUrl({
            bankId: bankInfo.bankId,
            accountNumber: bankInfo.accountNumber || '',
            amount: params.amount,
            content: params.transferContent,
            accountName: bankInfo.accountName || '',
        });
        const qrDataUrl = await QRCode.toDataURL(vietQRUrl, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff',
            },
        });
        return {
            qrCode: qrDataUrl,
            bankInfo: {
                bankName: bankInfo.bankName,
                accountNumber: bankInfo.accountNumber,
                accountName: bankInfo.accountName,
            },
            amount: params.amount,
            transferContent: params.transferContent,
            vietQRUrl,
        };
    }
    buildVietQRUrl(params) {
        const baseUrl = 'https://img.vietqr.io/image';
        const template = 'compact2';
        const url = new URL(`${baseUrl}/${params.bankId}-${params.accountNumber}-${template}.png`);
        url.searchParams.append('amount', params.amount.toString());
        url.searchParams.append('addInfo', params.content);
        url.searchParams.append('accountName', params.accountName);
        return url.toString();
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map