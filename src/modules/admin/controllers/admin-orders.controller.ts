import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AdminOrdersService } from '../services/admin-orders.service';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../../common/decorators';
import { Role } from '../../../common/constants/roles.enum';
import { ApproveOrderDto, RejectOrderDto } from '../dto';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

@Controller('admin/orders')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class AdminOrdersController {
  constructor(private readonly ordersService: AdminOrdersService) {}

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.ordersService.findAll({ status, search, page, limit });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Put(':id/approve')
  async approve(
    @Param('id') id: string,
    @CurrentUser() admin: AdminUser,
    @Body() dto: ApproveOrderDto,
  ) {
    return this.ordersService.approve(id, admin.id, dto);
  }

  @Put(':id/reject')
  async reject(
    @Param('id') id: string,
    @CurrentUser() admin: AdminUser,
    @Body() dto: RejectOrderDto,
  ) {
    return this.ordersService.reject(id, admin.id, dto);
  }
}
