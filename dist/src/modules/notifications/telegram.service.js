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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var TelegramService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const prisma_service_1 = require("../../prisma/prisma.service");
const licenses_service_1 = require("../licenses/licenses.service");
const email_service_1 = require("./email.service");
let TelegramService = TelegramService_1 = class TelegramService {
    configService;
    prisma;
    licensesService;
    emailService;
    bot = null;
    adminChatId;
    logger = new common_1.Logger(TelegramService_1.name);
    constructor(configService, prisma, licensesService, emailService) {
        this.configService = configService;
        this.prisma = prisma;
        this.licensesService = licensesService;
        this.emailService = emailService;
        this.adminChatId = this.configService.get('TELEGRAM_ADMIN_CHAT_ID', '');
    }
    onModuleInit() {
        const token = this.configService.get('TELEGRAM_BOT_TOKEN');
        if (token && token !== 'your-telegram-bot-token') {
            try {
                this.bot = new node_telegram_bot_api_1.default(token, { polling: true });
                this.logger.log('Telegram bot initialized with polling');
                this.setupCallbackHandler();
            }
            catch (error) {
                this.logger.warn('Failed to initialize Telegram bot:', error);
            }
        }
        else {
            this.logger.warn('Telegram bot token not configured');
        }
    }
    onModuleDestroy() {
        if (this.bot) {
            this.bot.stopPolling();
            this.logger.log('Telegram bot polling stopped');
        }
    }
    setupCallbackHandler() {
        if (!this.bot)
            return;
        this.bot.on('callback_query', async (query) => {
            if (!query.data || !query.message)
                return;
            const chatId = query.message.chat.id;
            const messageId = query.message.message_id;
            const [action, orderId] = query.data.split('_');
            this.logger.log(`Received callback: ${action} for order ${orderId}`);
            try {
                if (action === 'approve') {
                    await this.handleApprove(orderId, chatId, messageId, query.from?.username || 'Admin');
                }
                else if (action === 'reject') {
                    await this.handleReject(orderId, chatId, messageId, query.from?.username || 'Admin');
                }
                await this.bot?.answerCallbackQuery(query.id);
            }
            catch (error) {
                this.logger.error(`Error handling callback: ${error}`);
                await this.bot?.answerCallbackQuery(query.id, {
                    text: `Lỗi: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    show_alert: true,
                });
            }
        });
    }
    async handleApprove(orderId, chatId, messageId, approvedBy) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: true,
                package: true,
            },
        });
        if (!order) {
            throw new Error('Không tìm thấy đơn hàng');
        }
        if (order.status !== 'PROCESSING') {
            throw new Error(`Đơn hàng đang ở trạng thái: ${order.status}`);
        }
        const adminUser = await this.prisma.user.findFirst({
            where: { role: 'ADMIN' },
        });
        if (!adminUser) {
            throw new Error('Không tìm thấy admin');
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const license = await this.licensesService.create({
                userId: order.userId,
                orderId: order.id,
                packageId: order.packageId,
                maxDevices: order.package.maxDevices,
            }, adminUser.id);
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'COMPLETED',
                    approvedAt: new Date(),
                    approvedById: adminUser.id,
                    licenseId: license.id,
                    deliveryMethod: 'EMAIL',
                    deliveryContact: order.user.email,
                    deliveredAt: new Date(),
                    adminNotes: `Approved via Telegram by @${approvedBy}`,
                },
            });
            return { order: updatedOrder, license };
        });
        await this.emailService.sendLicenseEmail({
            to: order.user.email,
            userName: order.user.name,
            licenseKey: result.license.licenseKey,
            packageName: order.package.name,
            expiryDate: result.license.endDate,
        });
        const successMessage = `
✅ <b>Đã duyệt đơn hàng!</b>

📋 <b>Mã đơn:</b> ${order.orderNumber}
👤 <b>Khách hàng:</b> ${order.user.name}
📧 <b>Email:</b> ${order.user.email}
📦 <b>Gói:</b> ${order.package.name}
🔑 <b>License Key:</b> <code>${result.license.licenseKey}</code>
📅 <b>Hết hạn:</b> ${result.license.endDate.toLocaleDateString('vi-VN')}
👨‍💼 <b>Duyệt bởi:</b> @${approvedBy}
⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}
    `.trim();
        await this.bot?.editMessageText(successMessage, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
        });
    }
    async handleReject(orderId, chatId, messageId, rejectedBy) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { user: true, package: true },
        });
        if (!order) {
            throw new Error('Không tìm thấy đơn hàng');
        }
        if (order.status !== 'PROCESSING') {
            throw new Error(`Đơn hàng đang ở trạng thái: ${order.status}`);
        }
        const adminUser = await this.prisma.user.findFirst({
            where: { role: 'ADMIN' },
        });
        if (!adminUser) {
            throw new Error('Không tìm thấy admin');
        }
        await this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'REJECTED',
                rejectedAt: new Date(),
                rejectedById: adminUser.id,
                rejectionReason: `Rejected via Telegram by @${rejectedBy}`,
            },
        });
        const rejectMessage = `
❌ <b>Đã từ chối đơn hàng!</b>

📋 <b>Mã đơn:</b> ${order.orderNumber}
👤 <b>Khách hàng:</b> ${order.user.name}
📧 <b>Email:</b> ${order.user.email}
📦 <b>Gói:</b> ${order.package.name}
💰 <b>Số tiền:</b> ${Number(order.amount).toLocaleString('vi-VN')} VND
👨‍💼 <b>Từ chối bởi:</b> @${rejectedBy}
⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}
    `.trim();
        await this.bot?.editMessageText(rejectMessage, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
        });
    }
    async sendMessage(chatId, message, options) {
        if (!this.bot) {
            this.logger.warn('Telegram bot not initialized');
            return false;
        }
        try {
            await this.bot.sendMessage(chatId, message, {
                parse_mode: 'HTML',
                ...options,
            });
            return true;
        }
        catch (error) {
            this.logger.error('Failed to send Telegram message:', error);
            return false;
        }
    }
    async sendNewOrderNotification(order) {
        const message = `
🛒 <b>Đơn hàng mới!</b>

📋 <b>Mã đơn:</b> ${order.orderNumber}
👤 <b>Khách hàng:</b> ${order.userName}
📧 <b>Email:</b> ${order.userEmail}
📦 <b>Gói:</b> ${order.packageName}
💰 <b>Số tiền:</b> ${order.amount.toLocaleString('vi-VN')} VND
🏦 <b>Nội dung CK:</b> <code>${order.transferContent}</code>
📅 <b>Thời gian:</b> ${order.createdAt.toLocaleString('vi-VN')}

⏳ Chờ xác nhận thanh toán...
    `.trim();
        const inlineKeyboard = {
            inline_keyboard: [
                [
                    {
                        text: '✅ Duyệt đơn',
                        callback_data: `approve_${order.orderId}`,
                    },
                    {
                        text: '❌ Từ chối',
                        callback_data: `reject_${order.orderId}`,
                    },
                ],
            ],
        };
        return this.sendMessage(this.adminChatId, message, {
            reply_markup: inlineKeyboard,
        });
    }
    async sendOrderApprovedNotification(params) {
        const message = `
✅ <b>Đơn hàng đã duyệt</b>

📋 <b>Mã đơn:</b> ${params.orderNumber}
👤 <b>Khách hàng:</b> ${params.userName}
🔑 <b>License:</b> <code>${params.licenseKey}</code>
👨‍💼 <b>Duyệt bởi:</b> ${params.approvedBy}
📅 <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}
    `.trim();
        return this.sendMessage(this.adminChatId, message);
    }
    async sendOrderRejectedNotification(params) {
        const message = `
❌ <b>Đơn hàng đã từ chối</b>

📋 <b>Mã đơn:</b> ${params.orderNumber}
👤 <b>Khách hàng:</b> ${params.userName}
📝 <b>Lý do:</b> ${params.reason}
👨‍💼 <b>Từ chối bởi:</b> ${params.rejectedBy}
📅 <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}
    `.trim();
        return this.sendMessage(this.adminChatId, message);
    }
    async sendCustomMessage(message) {
        return this.sendMessage(this.adminChatId, message);
    }
};
exports.TelegramService = TelegramService;
exports.TelegramService = TelegramService = TelegramService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => licenses_service_1.LicensesService))),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => email_service_1.EmailService))),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        licenses_service_1.LicensesService,
        email_service_1.EmailService])
], TelegramService);
//# sourceMappingURL=telegram.service.js.map