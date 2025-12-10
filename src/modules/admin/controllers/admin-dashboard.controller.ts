import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminDashboardService } from '../services/admin-dashboard.service';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/constants/roles.enum';

@Controller('admin/dashboard')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get()
  async getStats() {
    return this.dashboardService.getStats();
  }
}
