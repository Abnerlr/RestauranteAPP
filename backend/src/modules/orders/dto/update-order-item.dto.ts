import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateOrderItemDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  qty?: number;

  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
