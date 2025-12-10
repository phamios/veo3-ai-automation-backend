import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private configService;
    private transporter;
    private readonly logger;
    constructor(configService: ConfigService);
    private sendEmail;
    sendLicenseEmail(params: {
        to: string;
        userName: string;
        licenseKey: string;
        packageName: string;
        expiryDate: Date;
    }): Promise<boolean>;
    sendPasswordResetEmail(params: {
        to: string;
        userName: string;
        resetUrl: string;
    }): Promise<boolean>;
    sendOtpEmail(params: {
        to: string;
        userName: string;
        otp: string;
        deviceName: string;
    }): Promise<boolean>;
    sendExpirationReminderEmail(params: {
        to: string;
        userName: string;
        packageName: string;
        expiryDate: Date;
        daysRemaining: number;
    }): Promise<boolean>;
}
