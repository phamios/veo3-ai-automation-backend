import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { EmailService } from '../notifications/email.service';
import { ErrorCodes } from '../../common/constants/error-codes';
import { generateOtp } from '../../utils';
import { ActivateLicenseDto, LogActivityDto, CheckLimitDto } from './dto';

interface ElectronJwtPayload {
  licenseId: string;
  hardwareId: string;
  userId: string;
}

@Injectable()
export class ElectronService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async activate(dto: ActivateLicenseDto, ipAddress?: string) {
    // Step 1: Find license
    const license = await this.prisma.license.findUnique({
      where: { licenseKey: dto.licenseKey },
      include: {
        package: true,
        user: { select: { id: true, name: true, email: true } },
        devices: { where: { isActive: true } },
      },
    });

    if (!license) {
      throw new NotFoundException({
        code: ErrorCodes.LICENSE_NOT_FOUND,
        message: 'License key not found',
      });
    }

    // Step 2: Check license status
    if (license.status === 'REVOKED') {
      throw new ForbiddenException({
        code: ErrorCodes.LICENSE_REVOKED,
        message: 'This license has been revoked',
      });
    }

    if (license.endDate < new Date()) {
      throw new ForbiddenException({
        code: ErrorCodes.LICENSE_EXPIRED,
        message: 'This license has expired',
      });
    }

    // Step 3: Check if device already exists
    const existingDevice = license.devices.find(
      (d) => d.hardwareId === dto.hardwareId,
    );

    if (existingDevice) {
      // Update last login
      await this.prisma.licenseDevice.update({
        where: { id: existingDevice.id },
        data: { lastLoginAt: new Date(), ipAddress },
      });

      const token = this.generateElectronToken({
        licenseId: license.id,
        hardwareId: dto.hardwareId,
        userId: license.userId,
      });

      return {
        token,
        license: this.formatLicenseResponse(license),
        device: existingDevice,
        message: 'Device already activated',
      };
    }

    // Step 4: Check device limit
    const activeDeviceCount = license.devices.length;
    if (activeDeviceCount >= license.maxDevices) {
      throw new ForbiddenException({
        code: ErrorCodes.DEVICE_LIMIT_REACHED,
        message: `Device limit reached: ${activeDeviceCount}/${license.maxDevices} devices used`,
      });
    }

    // Step 5: Create new device
    const newDevice = await this.prisma.licenseDevice.create({
      data: {
        licenseId: license.id,
        hardwareId: dto.hardwareId,
        deviceName: dto.deviceName,
        deviceOS: dto.deviceOS,
        ipAddress,
      },
    });

    // Step 6: Update license status if first activation
    if (license.status === 'UNUSED') {
      await this.prisma.license.update({
        where: { id: license.id },
        data: { status: 'ACTIVE', activatedAt: new Date() },
      });
    }

    // Step 7: Generate token
    const token = this.generateElectronToken({
      licenseId: license.id,
      hardwareId: dto.hardwareId,
      userId: license.userId,
    });

    return {
      token,
      license: this.formatLicenseResponse(license),
      device: newDevice,
      message: 'Device activated successfully',
    };
  }

  async verify(payload: ElectronJwtPayload) {
    const license = await this.prisma.license.findUnique({
      where: { id: payload.licenseId },
      include: {
        package: true,
        devices: { where: { hardwareId: payload.hardwareId, isActive: true } },
      },
    });

    if (!license) {
      throw new NotFoundException({
        code: ErrorCodes.LICENSE_NOT_FOUND,
        message: 'License not found',
      });
    }

    if (license.status === 'REVOKED') {
      throw new ForbiddenException({
        code: ErrorCodes.LICENSE_REVOKED,
        message: 'License has been revoked',
      });
    }

    if (license.endDate < new Date()) {
      throw new ForbiddenException({
        code: ErrorCodes.LICENSE_EXPIRED,
        message: 'License has expired',
      });
    }

    if (license.devices.length === 0) {
      throw new ForbiddenException({
        code: ErrorCodes.DEVICE_NOT_FOUND,
        message: 'Device not registered or has been deactivated',
      });
    }

    const daysRemaining = Math.ceil(
      (license.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    return {
      valid: true,
      license: this.formatLicenseResponse(license),
      daysRemaining,
    };
  }

  async refreshToken(payload: ElectronJwtPayload) {
    // Verify license and device still valid
    await this.verify(payload);

    // Generate new token
    return {
      token: this.generateElectronToken(payload),
    };
  }

  async getDevices(payload: ElectronJwtPayload) {
    const devices = await this.prisma.licenseDevice.findMany({
      where: { licenseId: payload.licenseId },
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

    return {
      devices,
      currentDevice: payload.hardwareId,
    };
  }

  async requestDeactivateOtp(
    payload: ElectronJwtPayload,
    deviceId: string,
  ) {
    const device = await this.prisma.licenseDevice.findFirst({
      where: { id: deviceId, licenseId: payload.licenseId },
      include: {
        license: {
          include: { user: { select: { email: true, name: true } } },
        },
      },
    });

    if (!device) {
      throw new NotFoundException({
        code: ErrorCodes.DEVICE_NOT_FOUND,
        message: 'Device not found',
      });
    }

    // Generate OTP
    const otp = generateOtp();
    const otpExpireMinutes = this.configService.get<number>(
      'OTP_EXPIRES_MINUTES',
      10,
    );

    // Store OTP in Redis
    const otpKey = `deactivate_otp:${payload.licenseId}:${deviceId}`;
    await this.redis.setex(otpKey, otpExpireMinutes * 60, otp);

    // Send OTP via email
    await this.emailService.sendOtpEmail({
      to: device.license.user.email,
      userName: device.license.user.name,
      otp,
      deviceName: device.deviceName,
    });

    return {
      message: 'OTP sent to your registered email',
      expiresIn: otpExpireMinutes * 60,
    };
  }

  async deactivateDevice(
    payload: ElectronJwtPayload,
    deviceId: string,
    otp: string,
    currentHardwareId: string,
  ) {
    const device = await this.prisma.licenseDevice.findFirst({
      where: { id: deviceId, licenseId: payload.licenseId },
    });

    if (!device) {
      throw new NotFoundException({
        code: ErrorCodes.DEVICE_NOT_FOUND,
        message: 'Device not found',
      });
    }

    // Check if trying to deactivate current device
    if (device.hardwareId === currentHardwareId) {
      throw new BadRequestException({
        code: ErrorCodes.CANNOT_DEACTIVATE_CURRENT_DEVICE,
        message: 'Cannot deactivate the current device',
      });
    }

    // Verify OTP
    const otpKey = `deactivate_otp:${payload.licenseId}:${deviceId}`;
    const storedOtp = await this.redis.get(otpKey);

    if (!storedOtp) {
      throw new BadRequestException({
        code: ErrorCodes.OTP_EXPIRED,
        message: 'OTP has expired or was not requested',
      });
    }

    if (storedOtp !== otp) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_OTP,
        message: 'Invalid OTP',
      });
    }

    // Deactivate device
    await this.prisma.licenseDevice.update({
      where: { id: deviceId },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedReason: 'User requested via OTP',
      },
    });

    // Remove OTP from Redis
    await this.redis.del(otpKey);

    return { message: 'Device deactivated successfully' };
  }

  async getLicenseInfo(payload: ElectronJwtPayload) {
    const license = await this.prisma.license.findUnique({
      where: { id: payload.licenseId },
      include: {
        package: true,
        devices: { where: { isActive: true } },
      },
    });

    if (!license) {
      throw new NotFoundException({
        code: ErrorCodes.LICENSE_NOT_FOUND,
        message: 'License not found',
      });
    }

    const daysRemaining = Math.ceil(
      (license.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    return {
      license: {
        id: license.id,
        licenseKey: license.licenseKey,
        status: license.status,
        startDate: license.startDate,
        endDate: license.endDate,
        daysRemaining,
      },
      package: {
        name: license.package.name,
        videosPerMonth: license.package.videosPerMonth,
        keywordsTracking: license.package.keywordsTracking,
        apiCallsPerMonth: license.package.apiCallsPerMonth,
      },
      devices: {
        active: license.devices.length,
        max: license.maxDevices,
      },
    };
  }

  async logActivity(
    payload: ElectronJwtPayload,
    dto: LogActivityDto,
    ipAddress?: string,
  ) {
    await this.prisma.activityLog.create({
      data: {
        userId: payload.userId,
        licenseId: payload.licenseId,
        actionType: dto.actionType,
        actionDetail: dto.actionDetail as object | undefined,
        ipAddress,
      },
    });

    return { logged: true };
  }

  async getUsageStats(payload: ElectronJwtPayload) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const license = await this.prisma.license.findUnique({
      where: { id: payload.licenseId },
      include: { package: true },
    });

    if (!license) {
      throw new NotFoundException({
        code: ErrorCodes.LICENSE_NOT_FOUND,
        message: 'License not found',
      });
    }

    // Count usage by action type
    const usageStats = await this.prisma.activityLog.groupBy({
      by: ['actionType'],
      where: {
        licenseId: payload.licenseId,
        createdAt: { gte: startOfMonth },
      },
      _count: { actionType: true },
    });

    const usage: Record<string, number> = {};
    usageStats.forEach((stat) => {
      usage[stat.actionType] = stat._count.actionType;
    });

    return {
      usage,
      limits: {
        videosPerMonth: license.package.videosPerMonth,
        keywordsTracking: license.package.keywordsTracking,
        apiCallsPerMonth: license.package.apiCallsPerMonth,
      },
      periodStart: startOfMonth,
    };
  }

  async checkLimit(payload: ElectronJwtPayload, dto: CheckLimitDto) {
    const stats = await this.getUsageStats(payload);
    const currentUsage = stats.usage[dto.actionType] || 0;

    let limit = 0;
    switch (dto.actionType) {
      case 'video_create':
        limit = stats.limits.videosPerMonth;
        break;
      case 'keyword_track':
        limit = stats.limits.keywordsTracking;
        break;
      case 'api_call':
        limit = stats.limits.apiCallsPerMonth;
        break;
      default:
        return { canProceed: true, remaining: -1 };
    }

    if (limit === 0) {
      return { canProceed: true, remaining: -1 }; // Unlimited
    }

    const remaining = limit - currentUsage;
    return {
      canProceed: remaining > 0,
      remaining: Math.max(0, remaining),
      limit,
      used: currentUsage,
    };
  }

  private generateElectronToken(payload: ElectronJwtPayload): string {
    return this.jwtService.sign(payload as object, {
      secret: this.configService.get<string>('ELECTRON_JWT_SECRET'),
      expiresIn: this.configService.get<number>('ELECTRON_JWT_EXPIRES_IN_SECONDS', 86400),
    });
  }

  private formatLicenseResponse(license: {
    id: string;
    licenseKey: string;
    status: string;
    startDate: Date;
    endDate: Date;
    maxDevices: number;
    package: {
      name: string;
      videosPerMonth: number;
      keywordsTracking: number;
      apiCallsPerMonth: number;
    };
  }) {
    return {
      id: license.id,
      licenseKey: license.licenseKey,
      status: license.status,
      startDate: license.startDate,
      endDate: license.endDate,
      maxDevices: license.maxDevices,
      package: {
        name: license.package.name,
        videosPerMonth: license.package.videosPerMonth,
        keywordsTracking: license.package.keywordsTracking,
        apiCallsPerMonth: license.package.apiCallsPerMonth,
      },
    };
  }
}
