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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var TelegramService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
let TelegramService = TelegramService_1 = class TelegramService {
    configService;
    bot = null;
    adminChatId;
    logger = new common_1.Logger(TelegramService_1.name);
    constructor(configService) {
        this.configService = configService;
        this.adminChatId = this.configService.get('TELEGRAM_ADMIN_CHAT_ID', '');
    }
    onModuleInit() {
        const token = this.configService.get('TELEGRAM_BOT_TOKEN');
        if (token && token !== 'your-telegram-bot-token') {
            try {
                this.bot = new node_telegram_bot_api_1.default(token, { polling: false });
                this.logger.log('Telegram bot initialized');
            }
            catch (error) {
                this.logger.warn('Failed to initialize Telegram bot:', error);
            }
        }
        else {
            this.logger.warn('Telegram bot token not configured');
        }
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
        const adminUrl = this.configService.get('ADMIN_URL');
        const message = `
🛒 <b>New Order Received!</b>

📋 <b>Order:</b> ${order.orderNumber}
👤 <b>Customer:</b> ${order.userName}
📧 <b>Email:</b> ${order.userEmail}
📦 <b>Package:</b> ${order.packageName}
💰 <b>Amount:</b> ${order.amount.toLocaleString()} VND
🏦 <b>Transfer Code:</b> <code>${order.transferContent}</code>
📅 <b>Time:</b> ${order.createdAt.toLocaleString()}

⏳ Waiting for payment confirmation...
    `.trim();
        const inlineKeyboard = {
            inline_keyboard: [
                [
                    {
                        text: '✅ Approve',
                        url: `${adminUrl}/orders/${order.orderNumber}/approve`,
                    },
                    {
                        text: '❌ Reject',
                        url: `${adminUrl}/orders/${order.orderNumber}/reject`,
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
✅ <b>Order Approved</b>

📋 <b>Order:</b> ${params.orderNumber}
👤 <b>Customer:</b> ${params.userName}
🔑 <b>License:</b> <code>${params.licenseKey}</code>
👨‍💼 <b>Approved by:</b> ${params.approvedBy}
📅 <b>Time:</b> ${new Date().toLocaleString()}
    `.trim();
        return this.sendMessage(this.adminChatId, message);
    }
    async sendOrderRejectedNotification(params) {
        const message = `
❌ <b>Order Rejected</b>

📋 <b>Order:</b> ${params.orderNumber}
👤 <b>Customer:</b> ${params.userName}
📝 <b>Reason:</b> ${params.reason}
👨‍💼 <b>Rejected by:</b> ${params.rejectedBy}
📅 <b>Time:</b> ${new Date().toLocaleString()}
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
    __metadata("design:paramtypes", [config_1.ConfigService])
], TelegramService);
//# sourceMappingURL=telegram.service.js.map