import { OrderItemStatus } from '@prisma/client';

export class OrderItemResponseDto {
  id: string;
  orderId: string;
  name: string;
  qty: number;
  unitPrice: string | null;
  status: OrderItemStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
