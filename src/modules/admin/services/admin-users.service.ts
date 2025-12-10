import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ErrorCodes } from '../../../common/constants/error-codes';

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { search?: string; page?: number; limit?: number }) {
    const { search, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isEmailVerified: true,
          createdAt: true,
          _count: { select: { orders: true, licenses: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        telegramContact: true,
        zaloContact: true,
        preferredContactMethod: true,
        isEmailVerified: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            amount: true,
            createdAt: true,
            package: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        licenses: {
          select: {
            id: true,
            licenseKey: true,
            status: true,
            startDate: true,
            endDate: true,
            package: { select: { name: true } },
            _count: { select: { devices: { where: { isActive: true } } } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: ErrorCodes.USER_NOT_FOUND,
        message: 'User not found',
      });
    }

    return user;
  }

  async update(
    id: string,
    data: {
      name?: string;
      phone?: string;
      role?: 'USER' | 'ADMIN';
      isEmailVerified?: boolean;
    },
  ) {
    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isEmailVerified: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async extendSubscription(
    userId: string,
    licenseId: string,
    months: number,
    adminId: string,
  ) {
    const license = await this.prisma.license.findFirst({
      where: { id: licenseId, userId },
    });

    if (!license) {
      throw new NotFoundException({
        code: ErrorCodes.LICENSE_NOT_FOUND,
        message: 'License not found',
      });
    }

    const newEndDate = new Date(license.endDate);
    newEndDate.setMonth(newEndDate.getMonth() + months);

    const updatedLicense = await this.prisma.license.update({
      where: { id: licenseId },
      data: {
        endDate: newEndDate,
        durationMonths: license.durationMonths + months,
        status: 'ACTIVE',
      },
    });

    // Log the extension
    await this.prisma.activityLog.create({
      data: {
        userId,
        licenseId,
        actionType: 'license_extended',
        actionDetail: {
          extendedBy: adminId,
          monthsAdded: months,
          newEndDate: newEndDate.toISOString(),
        },
      },
    });

    return updatedLicense;
  }
}
