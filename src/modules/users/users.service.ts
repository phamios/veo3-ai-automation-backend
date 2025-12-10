import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ErrorCodes } from '../../common/constants/error-codes';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
        createdAt: true,
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

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        telegramContact: true,
        zaloContact: true,
        preferredContactMethod: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async getSubscription(userId: string) {
    const license = await this.prisma.license.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gt: new Date() },
      },
      include: {
        package: {
          select: {
            name: true,
            description: true,
            videosPerMonth: true,
            keywordsTracking: true,
            apiCallsPerMonth: true,
            maxDevices: true,
          },
        },
      },
      orderBy: { endDate: 'desc' },
    });

    if (!license) {
      return { hasActiveSubscription: false, subscription: null };
    }

    const daysRemaining = Math.ceil(
      (license.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    return {
      hasActiveSubscription: true,
      subscription: {
        licenseKey: license.licenseKey,
        package: license.package,
        startDate: license.startDate,
        endDate: license.endDate,
        daysRemaining,
        maxDevices: license.maxDevices,
      },
    };
  }

  async getOrders(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        include: {
          package: {
            select: { name: true, durationMonths: true },
          },
          license: {
            select: { licenseKey: true, status: true, endDate: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLicenses(userId: string) {
    const licenses = await this.prisma.license.findMany({
      where: { userId },
      include: {
        package: {
          select: { name: true, durationMonths: true },
        },
        _count: {
          select: { devices: { where: { isActive: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return licenses.map((license) => ({
      id: license.id,
      licenseKey: license.licenseKey,
      package: license.package,
      status: license.status,
      startDate: license.startDate,
      endDate: license.endDate,
      maxDevices: license.maxDevices,
      activeDevices: license._count.devices,
      createdAt: license.createdAt,
    }));
  }

  async getLicenseDevices(userId: string, licenseId: string) {
    const license = await this.prisma.license.findFirst({
      where: { id: licenseId, userId },
    });

    if (!license) {
      throw new NotFoundException({
        code: ErrorCodes.LICENSE_NOT_FOUND,
        message: 'License not found',
      });
    }

    const devices = await this.prisma.licenseDevice.findMany({
      where: { licenseId },
      select: {
        id: true,
        deviceName: true,
        deviceOS: true,
        isActive: true,
        activatedAt: true,
        lastLoginAt: true,
      },
      orderBy: { activatedAt: 'desc' },
    });

    return devices;
  }
}
