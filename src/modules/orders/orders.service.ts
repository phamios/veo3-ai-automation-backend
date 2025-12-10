import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramService } from '../notifications/telegram.service';
import { ErrorCodes } from '../../common/constants/error-codes';
import { generateOrderNumber, generateTransferContent } from '../../utils';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    // Check if package exists and is active
    const pkg = await this.prisma.package.findUnique({
      where: { id: dto.packageId },
    });

    if (!pkg) {
      throw new NotFoundException({
        code: ErrorCodes.PACKAGE_NOT_FOUND,
        message: 'Package not found',
      });
    }

    if (!pkg.isActive) {
      throw new BadRequestException({
        code: ErrorCodes.PACKAGE_INACTIVE,
        message: 'Package is not available',
      });
    }

    // Generate unique order number and transfer content
    let orderNumber = generateOrderNumber();
    let transferContent = generateTransferContent();

    // Ensure uniqueness
    let existingOrder = await this.prisma.order.findFirst({
      where: { OR: [{ orderNumber }, { transferContent }] },
    });

    while (existingOrder) {
      orderNumber = generateOrderNumber();
      transferContent = generateTransferContent();
      existingOrder = await this.prisma.order.findFirst({
        where: { OR: [{ orderNumber }, { transferContent }] },
      });
    }

    // Set expiry to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId,
        packageId: dto.packageId,
        amount: pkg.salePrice,
        paymentMethod: dto.paymentMethod,
        transferContent,
        deliveryMethod: dto.deliveryMethod,
        deliveryContact: dto.deliveryContact,
        expiresAt,
      },
      include: {
        package: {
          select: {
            name: true,
            durationMonths: true,
            salePrice: true,
          },
        },
      },
    });

    return {
      order,
      payment: {
        transferContent,
        amount: pkg.salePrice,
        expiresAt,
      },
    };
  }

  async findOne(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        package: {
          select: {
            name: true,
            durationMonths: true,
            salePrice: true,
            originalPrice: true,
            discountPercent: true,
          },
        },
        license: {
          select: {
            licenseKey: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException({
        code: ErrorCodes.ORDER_NOT_FOUND,
        message: 'Order not found',
      });
    }

    if (order.userId !== userId) {
      throw new ForbiddenException({
        code: ErrorCodes.FORBIDDEN,
        message: 'Access denied',
      });
    }

    return order;
  }

  async confirm(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException({
        code: ErrorCodes.ORDER_NOT_FOUND,
        message: 'Order not found',
      });
    }

    if (order.userId !== userId) {
      throw new ForbiddenException({
        code: ErrorCodes.FORBIDDEN,
        message: 'Access denied',
      });
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_ORDER_STATUS,
        message: `Cannot confirm order with status: ${order.status}`,
      });
    }

    if (order.expiresAt < new Date()) {
      throw new BadRequestException({
        code: ErrorCodes.ORDER_EXPIRED,
        message: 'Order has expired',
      });
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PROCESSING',
        userConfirmedAt: new Date(),
      },
      include: {
        package: {
          select: { name: true, salePrice: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    });

    // Send Telegram notification to admin
    await this.telegramService.sendNewOrderNotification({
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      userName: updatedOrder.user?.name || 'Unknown',
      userEmail: updatedOrder.user?.email || 'Unknown',
      packageName: updatedOrder.package?.name || 'Unknown',
      amount: Number(updatedOrder.amount),
      transferContent: updatedOrder.transferContent,
      createdAt: updatedOrder.createdAt,
    });

    return updatedOrder;
  }

  async getStatus(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        userConfirmedAt: true,
        approvedAt: true,
        rejectedAt: true,
        rejectionReason: true,
        license: {
          select: {
            licenseKey: true,
            status: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException({
        code: ErrorCodes.ORDER_NOT_FOUND,
        message: 'Order not found',
      });
    }

    // Verify ownership
    const fullOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    if (fullOrder?.userId !== userId) {
      throw new ForbiddenException({
        code: ErrorCodes.FORBIDDEN,
        message: 'Access denied',
      });
    }

    return order;
  }
}
