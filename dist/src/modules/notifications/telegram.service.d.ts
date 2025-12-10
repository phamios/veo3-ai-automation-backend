import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { LicensesService } from '../licenses/licenses.service';
import { EmailService } from './email.service';
interface OrderInfo {
    orderNumber: string;
    orderId: string;
    userName: string;
    userEmail: string;
    packageName: string;
    amount: number;
    transferContent: string;
    createdAt: Date;
}
export declare class TelegramService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private prisma;
    private licensesService;
    private emailService;
    private bot;
    private adminChatId;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService, licensesService: LicensesService, emailService: EmailService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private setupCallbackHandler;
    private handleApprove;
    private handleReject;
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
