import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { ElectronService } from './electron.service';
import { Public } from '../../common/decorators';
import { ElectronAuthGuard } from '../../common/guards/electron-auth.guard';
import {
  ActivateLicenseDto,
  VerifyLicenseDto,
  RequestOtpDto,
  DeactivateDeviceDto,
  LogActivityDto,
  CheckLimitDto,
} from './dto';

interface ElectronRequest extends Request {
  electronUser: {
    licenseId: string;
    hardwareId: string;
    userId: string;
  };
}

@Controller('electron')
export class ElectronController {
  constructor(private readonly electronService: ElectronService) {}

  @Public()
  @Post('activate')
  @HttpCode(HttpStatus.OK)
  async activate(@Body() dto: ActivateLicenseDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.electronService.activate(dto, ip);
  }

  @UseGuards(ElectronAuthGuard)
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Req() req: ElectronRequest) {
    return this.electronService.verify(req.electronUser);
  }

  @UseGuards(ElectronAuthGuard)
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Req() req: ElectronRequest) {
    return this.electronService.refreshToken(req.electronUser);
  }

  @UseGuards(ElectronAuthGuard)
  @Get('license-info')
  async getLicenseInfo(@Req() req: ElectronRequest) {
    return this.electronService.getLicenseInfo(req.electronUser);
  }

  @UseGuards(ElectronAuthGuard)
  @Get('devices')
  async getDevices(@Req() req: ElectronRequest) {
    return this.electronService.getDevices(req.electronUser);
  }

  @UseGuards(ElectronAuthGuard)
  @Post('request-deactivate-otp')
  @HttpCode(HttpStatus.OK)
  async requestDeactivateOtp(
    @Req() req: ElectronRequest,
    @Body() dto: RequestOtpDto,
  ) {
    return this.electronService.requestDeactivateOtp(
      req.electronUser,
      dto.deviceId,
    );
  }

  @UseGuards(ElectronAuthGuard)
  @Post('deactivate-device')
  @HttpCode(HttpStatus.OK)
  async deactivateDevice(
    @Req() req: ElectronRequest,
    @Body() dto: DeactivateDeviceDto,
  ) {
    return this.electronService.deactivateDevice(
      req.electronUser,
      dto.deviceId,
      dto.otp,
      req.electronUser.hardwareId,
    );
  }

  @UseGuards(ElectronAuthGuard)
  @Post('log-activity')
  @HttpCode(HttpStatus.OK)
  async logActivity(
    @Req() req: ElectronRequest,
    @Body() dto: LogActivityDto,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.electronService.logActivity(req.electronUser, dto, ip);
  }

  @UseGuards(ElectronAuthGuard)
  @Get('usage-stats')
  async getUsageStats(@Req() req: ElectronRequest) {
    return this.electronService.getUsageStats(req.electronUser);
  }

  @UseGuards(ElectronAuthGuard)
  @Post('check-limit')
  @HttpCode(HttpStatus.OK)
  async checkLimit(
    @Req() req: ElectronRequest,
    @Body() dto: CheckLimitDto,
  ) {
    return this.electronService.checkLimit(req.electronUser, dto);
  }
}
