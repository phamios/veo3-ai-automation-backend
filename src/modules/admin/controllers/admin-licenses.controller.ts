import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { LicenseStatus } from '@prisma/client';
import { AdminLicensesService } from '../services/admin-licenses.service';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../../common/decorators';
import { Role } from '../../../common/constants/roles.enum';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

class GenerateLicenseDto {
  userId: string;
  packageId: string;
  maxDevices?: number;
}

class UpdateLicenseDto {
  maxDevices?: number;
  endDate?: Date;
  status?: LicenseStatus;
}

class RevokeLicenseDto {
  reason: string;
}

@Controller('admin/licenses')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class AdminLicensesController {
  constructor(private readonly licensesService: AdminLicensesService) {}

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.licensesService.findAll({ status, search, page, limit });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.licensesService.findOne(id);
  }

  @Post('generate')
  async generate(
    @CurrentUser() admin: AdminUser,
    @Body() dto: GenerateLicenseDto,
  ) {
    return this.licensesService.generate({
      ...dto,
      adminId: admin.id,
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateLicenseDto) {
    return this.licensesService.update(id, dto);
  }

  @Put(':id/revoke')
  async revoke(@Param('id') id: string, @Body() dto: RevokeLicenseDto) {
    return this.licensesService.revoke(id, dto.reason);
  }

  @Get(':id/devices')
  async getDevices(@Param('id') id: string) {
    return this.licensesService.getDevices(id);
  }

  @Delete(':id/devices/:deviceId')
  async removeDevice(
    @Param('id') licenseId: string,
    @Param('deviceId') deviceId: string,
  ) {
    return this.licensesService.removeDevice(licenseId, deviceId);
  }

  @Put(':id/reset-devices')
  async resetAllDevices(@Param('id') id: string) {
    return this.licensesService.resetAllDevices(id);
  }
}
