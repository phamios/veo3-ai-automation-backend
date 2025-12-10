import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators';
import { UpdateProfileDto } from './dto/update-profile.dto';

interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.id);
  }

  @Put('profile')
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Get('subscription')
  async getSubscription(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getSubscription(user.id);
  }

  @Get('orders')
  async getOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.usersService.getOrders(user.id, page, limit);
  }

  @Get('licenses')
  async getLicenses(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getLicenses(user.id);
  }

  @Get('licenses/:id/devices')
  async getLicenseDevices(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') licenseId: string,
  ) {
    return this.usersService.getLicenseDevices(user.id, licenseId);
  }
}
