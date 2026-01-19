import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderItemStatus } from '@prisma/client';

export class UpdateItemStatusDto {
  @IsEnum(OrderItemStatus)
  @IsNotEmpty()
  status: OrderItemStatus;
}
