import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
interface OrderInfo {
    orderNumber: string;
    userName: string;
    userEmail: string;
    packageName: string;
    amount: number;
    transferContent: string;
    createdAt: Date;
}
export declare class TelegramService implements OnModuleInit {
    private configService;
    private bot;
    private adminChatId;
    private readonly logger;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    private sendMessage;
    sendNewOrderNotification(order: OrderInfo): Promise<boolean>;
    sendOrderApprovedNotification(params: {
        orderNumber: string;
        userName: string;
        licenseKey: string;
        approvedBy: string;
    }): Promise<boolean>;
    sendOrderRejectedNotification(params: {
        orderNumber: string;
        userName: string;
        reason: string;
        rejectedBy: string;
    }): Promise<boolean>;
    sendCustomMessage(message: string): Promise<boolean>;
}
export {};
