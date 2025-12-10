import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AdminUsersService } from '../services/admin-users.service';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../../common/decorators';
import { Role } from '../../../common/constants/roles.enum';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

class UpdateUserDto {
  name?: string;
  phone?: string;
  role?: 'USER' | 'ADMIN';
  isEmailVerified?: boolean;
}

class ExtendSubscriptionDto {
  licenseId: string;
  months: number;
}

@Controller('admin/users')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class AdminUsersController {
  constructor(private readonly usersService: AdminUsersService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.usersService.findAll({ search, page, limit });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Post(':id/extend')
  async extendSubscription(
    @Param('id') userId: string,
    @CurrentUser() admin: AdminUser,
    @Body() dto: ExtendSubscriptionDto,
  ) {
    return this.usersService.extendSubscription(
      userId,
      dto.licenseId,
      dto.months,
      admin.id,
    );
  }
}
