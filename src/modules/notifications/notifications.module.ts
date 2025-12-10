import { Global, Module, forwardRef } from '@nestjs/common';
import { EmailService } from './email.service';
import { TelegramService } from './telegram.service';
import { LicensesModule } from '../licenses/licenses.module';

@Global()
@Module({
  imports: [forwardRef(() => LicensesModule)],
  providers: [EmailService, TelegramService],
  exports: [EmailService, TelegramService],
})
export class NotificationsModule {}
