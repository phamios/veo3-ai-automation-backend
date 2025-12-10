import { Controller, Get, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Public } from '../../common/decorators';

class GenerateQRDto {
  amount: number;
  transferContent: string;
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Get('methods')
  getMethods() {
    return this.paymentsService.getMethods();
  }

  @Public()
  @Get('bank-info')
  getBankInfo() {
    return this.paymentsService.getBankInfo();
  }

  @Post('generate-qr')
  async generateQR(@Body() dto: GenerateQRDto) {
    return this.paymentsService.generateQR(dto);
  }
}
