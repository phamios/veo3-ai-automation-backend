import { IsUUID, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateLicenseDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  orderId: string;

  @IsUUID()
  packageId: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  maxDevices?: number;

  @IsString()
  @IsOptional()
  appDownloadLink?: string;

  @IsString()
  @IsOptional()
  appVersion?: string;
}
