import { IsUUID, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentMethod, ContactMethod } from '@prisma/client';

export class CreateOrderDto {
  @IsUUID()
  packageId: string;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod = PaymentMethod.VND_BANK_TRANSFER;

  @IsEnum(ContactMethod)
  @IsOptional()
  deliveryMethod?: ContactMethod;

  @IsString()
  @IsOptional()
  deliveryContact?: string;
}
