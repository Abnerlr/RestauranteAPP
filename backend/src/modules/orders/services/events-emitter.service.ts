import { Injectable } from '@nestjs/common';
import { OrderItemResponseDto } from '../dto/order-item-response.dto';

export interface OrderNewPayload {
  orderId: string;
  restaurantId: string;
  tableSessionId: string;
  status: string;
  items: OrderItemResponseDto[];
  createdAt: Date;
}

export interface OrderItemStatusChangedPayload {
  orderId: string;
  itemId: string;
  restaurantId: string;
  previousStatus: string;
  newStatus: string;
  updatedAt: Date;
}

export interface OrderStatusChangedPayload {
  orderId: string;
  restaurantId: string;
  previousStatus: string;
  newStatus: string;
  updatedAt: Date;
}

@Injectable()
export class EventsEmitterService {
  // TODO: Implement WebSocket event emission
  // This service will emit events to connected clients via WebSocket

  async emitOrderNew(payload: OrderNewPayload): Promise<void> {
    // TODO: Emit 'order.new' event via WebSocket gateway
    console.log('[EventsEmitter] order.new:', JSON.stringify(payload, null, 2));
  }

  async emitOrderItemStatusChanged(payload: OrderItemStatusChangedPayload): Promise<void> {
    // TODO: Emit 'order.item.status.changed' event via WebSocket gateway
    console.log('[EventsEmitter] order.item.status.changed:', JSON.stringify(payload, null, 2));
  }

  async emitOrderStatusChanged(payload: OrderStatusChangedPayload): Promise<void> {
    // TODO: Emit 'order.status.changed' event via WebSocket gateway
    console.log('[EventsEmitter] order.status.changed:', JSON.stringify(payload, null, 2));
  }
}
