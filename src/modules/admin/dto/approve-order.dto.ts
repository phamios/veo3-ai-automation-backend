import {
  IsInt,
  IsOptional,
  IsPositive,
  IsEnum,
  IsString,
} from 'class-validator';
import { ContactMethod } from '@prisma/client';

export class ApproveOrderDto {
  @IsInt()
  @IsPositive()
  @IsOptional()
  maxDevices?: number;

  @IsEnum(ContactMethod)
  @IsOptional()
  deliveryMethod?: ContactMethod;

  @IsString()
  @IsOptional()
  deliveryContact?: string;

  @IsString()
  @IsOptional()
  adminNotes?: string;
}
