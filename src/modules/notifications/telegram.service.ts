import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';

interface OrderInfo {
  orderNumber: string;
  userName: string;
  userEmail: string;
  packageName: string;
  amount: number;
  transferContent: string;
  createdAt: Date;
}

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: TelegramBot | null = null;
  private adminChatId: string;
  private readonly logger = new Logger(TelegramService.name);

  constructor(private configService: ConfigService) {
    this.adminChatId = this.configService.get<string>(
      'TELEGRAM_ADMIN_CHAT_ID',
      '',
    );
  }

  onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (token && token !== 'your-telegram-bot-token') {
      try {
        this.bot = new TelegramBot(token, { polling: false });
        this.logger.log('Telegram bot initialized');
      } catch (error) {
        this.logger.warn('Failed to initialize Telegram bot:', error);
      }
    } else {
      this.logger.warn('Telegram bot token not configured');
    }
  }

  private async sendMessage(
    chatId: string,
    message: string,
    options?: TelegramBot.SendMessageOptions,
  ): Promise<boolean> {
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
    } catch (error) {
      this.logger.error('Failed to send Telegram message:', error);
      return false;
    }
  }

  async sendNewOrderNotification(order: OrderInfo): Promise<boolean> {
    const adminUrl = this.configService.get<string>('ADMIN_URL');
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

    const inlineKeyboard: TelegramBot.InlineKeyboardMarkup = {
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

  async sendOrderApprovedNotification(params: {
    orderNumber: string;
    userName: string;
    licenseKey: string;
    approvedBy: string;
  }): Promise<boolean> {
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

  async sendOrderRejectedNotification(params: {
    orderNumber: string;
    userName: string;
    reason: string;
    rejectedBy: string;
  }): Promise<boolean> {
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

  async sendCustomMessage(message: string): Promise<boolean> {
    return this.sendMessage(this.adminChatId, message);
  }
}
