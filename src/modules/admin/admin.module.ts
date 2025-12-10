import { Module } from '@nestjs/common';
import {
  AdminDashboardController,
  AdminOrdersController,
  AdminUsersController,
  AdminLicensesController,
} from './controllers';
import {
  AdminDashboardService,
  AdminOrdersService,
  AdminUsersService,
  AdminLicensesService,
} from './services';
import { LicensesModule } from '../licenses/licenses.module';

@Module({
  imports: [LicensesModule],
  controllers: [
    AdminDashboardController,
    AdminOrdersController,
    AdminUsersController,
    AdminLicensesController,
  ],
  providers: [
    AdminDashboardService,
    AdminOrdersService,
    AdminUsersService,
    AdminLicensesService,
  ],
})
export class AdminModule {}
