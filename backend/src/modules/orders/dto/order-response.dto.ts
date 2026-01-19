import { OrderStatus } from '@prisma/client';
import { OrderItemResponseDto } from './order-item-response.dto';

export class OrderResponseDto {
  id: string;
  restaurantId: string;
  tableSessionId: string;
  createdByUserId: string;
  status: OrderStatus;
  notes: string | null;
  confirmedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemResponseDto[];
}
