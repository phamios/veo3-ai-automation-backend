import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ContactMethod } from '@prisma/client';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  telegramContact?: string;

  @IsString()
  @IsOptional()
  zaloContact?: string;

  @IsEnum(ContactMethod)
  @IsOptional()
  preferredContactMethod?: ContactMethod;
}
