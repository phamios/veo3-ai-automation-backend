import { Injectable, NotFoundException } from '@nestjs/common';
import { LicenseStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { LicensesService } from '../../licenses/licenses.service';
import { ErrorCodes } from '../../../common/constants/error-codes';

@Injectable()
export class AdminLicensesService {
  constructor(
    private prisma: PrismaService,
    private licensesService: LicensesService,
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
        { licenseKey: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [licenses, total] = await Promise.all([
      this.prisma.license.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          package: { select: { name: true } },
          _count: { select: { devices: { where: { isActive: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.license.count({ where }),
    ]);

    return {
      licenses,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const license = await this.prisma.license.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        package: true,
        order: { select: { orderNumber: true, amount: true } },
        createdBy: { select: { name: true, email: true } },
        devices: {
          orderBy: { activatedAt: 'desc' },
        },
      },
    });

    if (!license) {
      throw new NotFoundException({
        code: ErrorCodes.LICENSE_NOT_FOUND,
        message: 'License not found',
      });
    }

    return license;
  }

  async generate(params: {
    userId: string;
    packageId: string;
    maxDevices?: number;
    adminId: string;
  }) {
    // Create a dummy order for manual license generation
    const pkg = await this.prisma.package.findUnique({
      where: { id: params.packageId },
    });

    if (!pkg) {
      throw new NotFoundException({
        code: ErrorCodes.PACKAGE_NOT_FOUND,
        message: 'Package not found',
      });
    }

    const order = await this.prisma.order.create({
      data: {
        orderNumber: `MANUAL-${Date.now()}`,
        userId: params.userId,
        packageId: params.packageId,
        amount: 0,
        transferContent: `MANUAL-${Date.now()}`,
        status: 'COMPLETED',
        approvedAt: new Date(),
        approvedById: params.adminId,
        expiresAt: new Date(),
        adminNotes: 'Manually generated license',
      },
    });

    return this.licensesService.create(
      {
        userId: params.userId,
        orderId: order.id,
        packageId: params.packageId,
        maxDevices: params.maxDevices,
      },
      params.adminId,
    );
  }

  async update(
    id: string,
    data: { maxDevices?: number; endDate?: Date; status?: LicenseStatus },
  ) {
    return this.prisma.license.update({
      where: { id },
      data,
      include: {
        user: { select: { name: true, email: true } },
        package: { select: { name: true } },
      },
    });
  }

  async revoke(id: string, reason: string) {
    return this.licensesService.revoke(id, reason);
  }

  async getDevices(licenseId: string) {
    return this.prisma.licenseDevice.findMany({
      where: { licenseId },
      orderBy: { activatedAt: 'desc' },
    });
  }

  async removeDevice(licenseId: string, deviceId: string) {
    const device = await this.prisma.licenseDevice.findFirst({
      where: { id: deviceId, licenseId },
    });

    if (!device) {
      throw new NotFoundException({
        code: ErrorCodes.DEVICE_NOT_FOUND,
        message: 'Device not found',
      });
    }

    return this.licensesService.removeDevice(deviceId, 'Admin removed');
  }

  async resetAllDevices(licenseId: string) {
    await this.prisma.licenseDevice.updateMany({
      where: { licenseId, isActive: true },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedReason: 'Admin reset all devices',
      },
    });

    return { message: 'All devices have been deactivated' };
  }
}
