import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../modules/notifications/email.service';
export declare class TasksService {
    private prisma;
    private emailService;
    private readonly logger;
    constructor(prisma: PrismaService, emailService: EmailService);
    handleExpiredOrders(): Promise<void>;
    handleExpiredLicenses(): Promise<void>;
    handleExpirationReminders(): Promise<void>;
    cleanupExpiredSessions(): Promise<void>;
    cleanupOldActivityLogs(): Promise<void>;
}
