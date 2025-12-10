import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ErrorCodes } from '../../common/constants/error-codes';
import { generateLicenseKey, isValidLicenseKeyFormat } from '../../utils';
import { CreateLicenseDto } from './dto/create-license.dto';

@Injectable()
export class LicensesService {
  constructor(private prisma: PrismaService) {}

  async generateKey(): Promise<string> {
    let key = generateLicenseKey();
    let exists = await this.prisma.license.findUnique({
      where: { licenseKey: key },
    });

    while (exists) {
      key = generateLicenseKey();
      exists = await this.prisma.license.findUnique({
        where: { licenseKey: key },
      });
    }

    return key;
  }

  async create(dto: CreateLicenseDto, createdById: string) {
    const pkg = await this.prisma.package.findUnique({
      where: { id: dto.packageId },
    });

    if (!pkg) {
      throw new NotFoundException({
        code: ErrorCodes.PACKAGE_NOT_FOUND,
        message: 'Package not found',
      });
    }

    const licenseKey = await this.generateKey();
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + pkg.durationMonths);

    const license = await this.prisma.license.create({
      data: {
        licenseKey,
        userId: dto.userId,
        orderId: dto.orderId,
        packageId: dto.packageId,
        startDate,
        endDate,
        durationMonths: pkg.durationMonths,
        maxDevices: dto.maxDevices || pkg.maxDevices,
        appDownloadLink: dto.appDownloadLink,
        appVersion: dto.appVersion,
        createdById,
      },
      include: {
        package: {
          select: { name: true, durationMonths: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    });

    return license;
  }

  async findByKey(licenseKey: string) {
    if (!isValidLicenseKeyFormat(licenseKey)) {
      throw new BadRequestException({
        code: ErrorCodes.LICENSE_INVALID,
        message: 'Invalid license key format',
      });
    }

    const license = await this.prisma.license.findUnique({
      where: { licenseKey },
      include: {
        package: true,
        user: {
          select: { id: true, name: true, email: true },
        },
        devices: {
          where: { isActive: true },
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

  async validateLicense(licenseKey: string) {
    const license = await this.findByKey(licenseKey);

    if (license.status === 'REVOKED') {
      throw new BadRequestException({
        code: ErrorCodes.LICENSE_REVOKED,
        message: 'License has been revoked',
      });
    }

    if (license.status === 'EXPIRED' || license.endDate < new Date()) {
      throw new BadRequestException({
        code: ErrorCodes.LICENSE_EXPIRED,
        message: 'License has expired',
      });
    }

    return {
      valid: true,
      license: {
        id: license.id,
        licenseKey: license.licenseKey,
        status: license.status,
        maxDevices: license.maxDevices,
        activeDevices: license.devices.length,
        startDate: license.startDate,
        endDate: license.endDate,
        package: license.package,
      },
    };
  }

  async getDeviceCount(licenseId: string): Promise<number> {
    return this.prisma.licenseDevice.count({
      where: { licenseId, isActive: true },
    });
  }

  async addDevice(
    licenseId: string,
    deviceData: {
      hardwareId: string;
      deviceName: string;
      deviceOS: string;
      ipAddress?: string;
    },
  ) {
    // Check if device already exists
    const existingDevice = await this.prisma.licenseDevice.findUnique({
      where: {
        licenseId_hardwareId: {
          licenseId,
          hardwareId: deviceData.hardwareId,
        },
      },
    });

    if (existingDevice) {
      // Reactivate if inactive
      if (!existingDevice.isActive) {
        return this.prisma.licenseDevice.update({
          where: { id: existingDevice.id },
          data: {
            isActive: true,
            activatedAt: new Date(),
            lastLoginAt: new Date(),
            deactivatedAt: null,
            deactivatedReason: null,
          },
        });
      }
      // Update last login if active
      return this.prisma.licenseDevice.update({
        where: { id: existingDevice.id },
        data: { lastLoginAt: new Date(), ipAddress: deviceData.ipAddress },
      });
    }

    // Create new device
    return this.prisma.licenseDevice.create({
      data: {
        licenseId,
        ...deviceData,
      },
    });
  }

  async removeDevice(deviceId: string, reason?: string) {
    const device = await this.prisma.licenseDevice.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new NotFoundException({
        code: ErrorCodes.DEVICE_NOT_FOUND,
        message: 'Device not found',
      });
    }

    return this.prisma.licenseDevice.update({
      where: { id: deviceId },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedReason: reason || 'User requested',
      },
    });
  }

  async revoke(licenseId: string, reason: string) {
    const license = await this.prisma.license.findUnique({
      where: { id: licenseId },
    });

    if (!license) {
      throw new NotFoundException({
        code: ErrorCodes.LICENSE_NOT_FOUND,
        message: 'License not found',
      });
    }

    return this.prisma.license.update({
      where: { id: licenseId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });
  }
}
