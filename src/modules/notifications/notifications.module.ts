import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { TelegramService } from './telegram.service';

@Global()
@Module({
  providers: [EmailService, TelegramService],
  exports: [EmailService, TelegramService],
})
export class NotificationsModule {}
