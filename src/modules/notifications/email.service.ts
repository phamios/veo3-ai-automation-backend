import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  private async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_FROM'),
        ...options,
      });
      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendLicenseEmail(params: {
    to: string;
    userName: string;
    licenseKey: string;
    packageName: string;
    expiryDate: Date;
  }): Promise<boolean> {
    const appDownloadWindows = this.configService.get<string>(
      'APP_DOWNLOAD_WINDOWS',
    );
    const appDownloadMac = this.configService.get<string>('APP_DOWNLOAD_MAC');
    const appDownloadLinux = this.configService.get<string>(
      'APP_DOWNLOAD_LINUX',
    );

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

  async sendPasswordResetEmail(params: {
    to: string;
    userName: string;
    resetUrl: string;
  }): Promise<boolean> {
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

  async sendOtpEmail(params: {
    to: string;
    userName: string;
    otp: string;
    deviceName: string;
  }): Promise<boolean> {
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

  async sendExpirationReminderEmail(params: {
    to: string;
    userName: string;
    packageName: string;
    expiryDate: Date;
    daysRemaining: number;
  }): Promise<boolean> {
    const renewUrl = this.configService.get<string>('FRONTEND_URL') + '/pricing';

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
}
