import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  tableSessionId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
