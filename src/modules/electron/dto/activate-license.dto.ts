import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ActivateLicenseDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/, {
    message: 'Invalid license key format. Expected: XXXX-XXXX-XXXX-XXXX',
  })
  licenseKey: string;

  @IsString()
  @IsNotEmpty()
  hardwareId: string;

  @IsString()
  @IsNotEmpty()
  deviceName: string;

  @IsString()
  @IsNotEmpty()
  deviceOS: string;
}
