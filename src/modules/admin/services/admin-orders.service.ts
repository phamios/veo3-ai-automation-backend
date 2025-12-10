import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LicensesService } from '../../licenses/licenses.service';
import { TelegramService } from '../../notifications/telegram.service';
import { EmailService } from '../../notifications/email.service';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { ApproveOrderDto, RejectOrderDto } from '../dto';

@Injectable()
export class AdminOrdersService {
  constructor(
    private prisma: PrismaService,
    private licensesService: LicensesService,
    private telegramService: TelegramService,
    private emailService: EmailService,
  ) {}

  async findAll(params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, search, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          package: { select: { name: true, durationMonths: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        package: true,
        license: { include: { devices: true } },
        approvedBy: { select: { name: true, email: true } },
        rejectedBy: { select: { name: true, email: true } },
      },
    });

    if (!order) {
      throw new NotFoundException({
        code: ErrorCodes.ORDER_NOT_FOUND,
        message: 'Order not found',
      });
    }

    return order;
  }

  async approve(orderId: string, adminId: string, dto: ApproveOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        package: true,
      },
    });

    if (!order) {
      throw new NotFoundException({
        code: ErrorCodes.ORDER_NOT_FOUND,
        message: 'Order not found',
      });
    }

    if (order.status !== 'PROCESSING') {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_ORDER_STATUS,
        message: `Cannot approve order with status: ${order.status}`,
      });
    }

    // Create license using transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Generate license
      const license = await this.licensesService.create(
        {
          userId: order.userId,
          orderId: order.id,
          packageId: order.packageId,
          maxDevices: dto.maxDevices,
        },
        adminId,
      );

      // Update order
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED',
          approvedAt: new Date(),
          approvedById: adminId,
          licenseId: license.id,
          deliveryMethod: dto.deliveryMethod || order.user.preferredContactMethod,
          deliveryContact:
            dto.deliveryContact ||
            this.getDeliveryContact(
              order.user,
              dto.deliveryMethod || order.user.preferredContactMethod,
            ),
          deliveredAt: new Date(),
          adminNotes: dto.adminNotes,
        },
        include: {
          user: { select: { name: true, email: true } },
          package: { select: { name: true } },
          license: { select: { licenseKey: true, endDate: true } },
        },
      });

      return { order: updatedOrder, license };
    });

    // Send notifications
    await this.emailService.sendLicenseEmail({
      to: order.user.email,
      userName: order.user.name,
      licenseKey: result.license.licenseKey,
      packageName: order.package.name,
      expiryDate: result.license.endDate,
    });

    await this.telegramService.sendOrderApprovedNotification({
      orderNumber: order.orderNumber,
      userName: order.user.name,
      licenseKey: result.license.licenseKey,
      approvedBy: adminId,
    });

    return result.order;
  }

  async reject(orderId: string, adminId: string, dto: RejectOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      throw new NotFoundException({
        code: ErrorCodes.ORDER_NOT_FOUND,
        message: 'Order not found',
      });
    }

    if (order.status !== 'PROCESSING') {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_ORDER_STATUS,
        message: `Cannot reject order with status: ${order.status}`,
      });
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedById: adminId,
        rejectionReason: dto.reason,
      },
      include: {
        user: { select: { name: true, email: true } },
        package: { select: { name: true } },
      },
    });

    await this.telegramService.sendOrderRejectedNotification({
      orderNumber: order.orderNumber,
      userName: order.user.name,
      reason: dto.reason,
      rejectedBy: adminId,
    });

    return updatedOrder;
  }

  private getDeliveryContact(
    user: { email: string; telegramContact?: string | null; zaloContact?: string | null },
    method: string,
  ): string {
    switch (method) {
      case 'TELEGRAM':
        return user.telegramContact || user.email;
      case 'ZALO':
        return user.zaloContact || user.email;
      default:
        return user.email;
    }
  }
}
