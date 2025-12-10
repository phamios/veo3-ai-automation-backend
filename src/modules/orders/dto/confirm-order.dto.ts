import { IsOptional, IsString } from 'class-validator';

export class ConfirmOrderDto {
  @IsString()
  @IsOptional()
  note?: string;
}
