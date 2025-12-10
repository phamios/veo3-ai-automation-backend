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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
let EmailService = EmailService_1 = class EmailService {
    configService;
    transporter;
    logger = new common_1.Logger(EmailService_1.name);
    constructor(configService) {
        this.configService = configService;
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('SMTP_HOST'),
            port: this.configService.get('SMTP_PORT', 587),
            secure: false,
            auth: {
                user: this.configService.get('SMTP_USER'),
                pass: this.configService.get('SMTP_PASS'),
            },
        });
    }
    async sendEmail(options) {
        try {
            await this.transporter.sendMail({
                from: this.configService.get('EMAIL_FROM'),
                ...options,
            });
            this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${options.to}:`, error);
            return false;
        }
    }
    async sendLicenseEmail(params) {
        const appDownloadWindows = this.configService.get('APP_DOWNLOAD_WINDOWS');
        const appDownloadMac = this.configService.get('APP_DOWNLOAD_MAC');
        const appDownloadLinux = this.configService.get('APP_DOWNLOAD_LINUX');
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">License Key Delivered</h1>
        <p>Hello ${params.userName},</p>
        <p>Thank you for your purchase! Here is your license information:</p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Package:</strong> ${params.packageName}</p>
          <p><strong>License Key:</strong></p>
          <code style="background: #e0e0e0; padding: 10px; display: block; font-size: 18px; letter-spacing: 2px;">
            ${params.licenseKey}
          </code>
          <p><strong>Valid Until:</strong> ${params.expiryDate.toLocaleDateString()}</p>
        </div>

        <h2>Download VEO3 AI App</h2>
        <ul>
          <li><a href="${appDownloadWindows}">Windows</a></li>
          <li><a href="${appDownloadMac}">macOS</a></li>
          <li><a href="${appDownloadLinux}">Linux</a></li>
        </ul>

        <h2>How to Activate</h2>
        <ol>
          <li>Download and install the app</li>
          <li>Open VEO3 AI app</li>
          <li>Enter your license key</li>
          <li>Start creating amazing videos!</li>
        </ol>

        <p>If you have any questions, please contact our support team.</p>
        <p>Best regards,<br>VEO3 AI Team</p>
      </div>
    `;
        return this.sendEmail({
            to: params.to,
            subject: 'Your VEO3 AI License Key',
            html,
        });
    }
    async sendPasswordResetEmail(params) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Password Reset Request</h1>
        <p>Hello ${params.userName},</p>
        <p>We received a request to reset your password. Click the button below to proceed:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.resetUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            Reset Password
          </a>
        </div>

        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>

        <p>Best regards,<br>VEO3 AI Team</p>
      </div>
    `;
        return this.sendEmail({
            to: params.to,
            subject: 'Reset Your VEO3 AI Password',
            html,
        });
    }
    async sendOtpEmail(params) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Device Deactivation OTP</h1>
        <p>Hello ${params.userName},</p>
        <p>You requested to deactivate device: <strong>${params.deviceName}</strong></p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p>Your OTP code is:</p>
          <code style="font-size: 32px; letter-spacing: 8px; font-weight: bold;">
            ${params.otp}
          </code>
        </div>

        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please secure your account immediately.</p>

        <p>Best regards,<br>VEO3 AI Team</p>
      </div>
    `;
        return this.sendEmail({
            to: params.to,
            subject: 'Device Deactivation OTP - VEO3 AI',
            html,
        });
    }
    async sendExpirationReminderEmail(params) {
        const renewUrl = this.configService.get('FRONTEND_URL') + '/pricing';
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Subscription Expiring Soon</h1>
        <p>Hello ${params.userName},</p>
        <p>Your <strong>${params.packageName}</strong> subscription will expire in <strong>${params.daysRemaining} days</strong> (${params.expiryDate.toLocaleDateString()}).</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${renewUrl}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            Renew Now
          </a>
        </div>

        <p>Don't miss out on continued access to VEO3 AI features!</p>

        <p>Best regards,<br>VEO3 AI Team</p>
      </div>
    `;
        return this.sendEmail({
            to: params.to,
            subject: `Your VEO3 AI Subscription Expires in ${params.daysRemaining} Days`,
            html,
        });
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map