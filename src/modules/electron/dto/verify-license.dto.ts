import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyLicenseDto {
  @IsString()
  @IsNotEmpty()
  hardwareId: string;
}
