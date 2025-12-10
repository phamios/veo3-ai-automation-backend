import { IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';

export class LogActivityDto {
  @IsString()
  @IsNotEmpty()
  actionType: string;

  @IsObject()
  @IsOptional()
  actionDetail?: Record<string, unknown>;
}

export class CheckLimitDto {
  @IsString()
  @IsNotEmpty()
  actionType: string;
}
