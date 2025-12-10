import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';
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

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private bot: TelegramBot | null = null;
  private adminChatId: string;
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    @Inject(forwardRef(() => LicensesService))
    private licensesService: LicensesService,
    @Inject(forwardRef(() => EmailService))
    private emailService: EmailService,
  ) {
    this.adminChatId = this.configService.get<string>(
      'TELEGRAM_ADMIN_CHAT_ID',
      '',
    );
  }

  onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (token && token !== 'your-telegram-bot-token') {
      try {
        // Enable polling to receive callback queries
        this.bot = new TelegramBot(token, { polling: true });
        this.logger.log('Telegram bot initialized with polling');

        // Setup callback query handler
        this.setupCallbackHandler();
      } catch (error) {
        this.logger.warn('Failed to initialize Telegram bot:', error);
      }
    } else {
      this.logger.warn('Telegram bot token not configured');
    }
  }

  onModuleDestroy() {
    if (this.bot) {
      this.bot.stopPolling();
      this.logger.log('Telegram bot polling stopped');
    }
  }

  private setupCallbackHandler() {
    if (!this.bot) return;

    this.bot.on('callback_query', async (query) => {
      if (!query.data || !query.message) return;

      const chatId = query.message.chat.id;
      const messageId = query.message.message_id;
      const [action, orderId] = query.data.split('_');

      this.logger.log(`Received callback: ${action} for order ${orderId}`);

      try {
        if (action === 'approve') {
          await this.handleApprove(orderId, chatId, messageId, query.from?.username || 'Admin');
        } else if (action === 'reject') {
          await this.handleReject(orderId, chatId, messageId, query.from?.username || 'Admin');
        }

        // Answer callback to remove loading state
        await this.bot?.answerCallbackQuery(query.id);
      } catch (error) {
        this.logger.error(`Error handling callback: ${error}`);
        await this.bot?.answerCallbackQuery(query.id, {
          text: `Lỗi: ${error instanceof Error ? error.message : 'Unknown error'}`,
          show_alert: true,
        });
      }
    });
  }

  private async handleApprove(
    orderId: string,
    chatId: number,
    messageId: number,
    approvedBy: string,
  ) {
    // Get order with details
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

    // Get admin user (first admin in system for now)
    const adminUser = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminUser) {
      throw new Error('Không tìm thấy admin');
    }

    // Create license and update order
    const result = await this.prisma.$transaction(async (tx) => {
      // Generate license
      const license = await this.licensesService.create(
        {
          userId: order.userId,
          orderId: order.id,
          packageId: order.packageId,
          maxDevices: order.package.maxDevices,
        },
        adminUser.id,
      );

      // Update order
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

    // Send email with license
    await this.emailService.sendLicenseEmail({
      to: order.user.email,
      userName: order.user.name,
      licenseKey: result.license.licenseKey,
      packageName: order.package.name,
      expiryDate: result.license.endDate,
    });

    // Update Telegram message
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

  private async handleReject(
    orderId: string,
    chatId: number,
    messageId: number,
    rejectedBy: string,
  ) {
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

    // Get admin user
    const adminUser = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminUser) {
      throw new Error('Không tìm thấy admin');
    }

    // Update order status
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedById: adminUser.id,
        rejectionReason: `Rejected via Telegram by @${rejectedBy}`,
      },
    });

    // Update Telegram message
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

    // Use callback_data for buttons (works without public URL)
    const inlineKeyboard: TelegramBot.InlineKeyboardMarkup = {
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

  async sendOrderApprovedNotification(params: {
    orderNumber: string;
    userName: string;
    licenseKey: string;
    approvedBy: string;
  }): Promise<boolean> {
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

  async sendOrderRejectedNotification(params: {
    orderNumber: string;
    userName: string;
    reason: string;
    rejectedBy: string;
  }): Promise<boolean> {
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

  async sendCustomMessage(message: string): Promise<boolean> {
    return this.sendMessage(this.adminChatId, message);
  }
}
