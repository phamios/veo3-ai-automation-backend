import { IsUUID, IsString, Length, IsEmail } from 'class-validator';

export class RequestOtpDto {
  @IsUUID()
  deviceId: string;
}

export class DeactivateDeviceDto {
  @IsUUID()
  deviceId: string;

  @IsString()
  @Length(6, 6)
  otp: string;
}
