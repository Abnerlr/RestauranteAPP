import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from '../../../websocket/websocket.gateway';
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
  constructor(private readonly realtimeGateway: RealtimeGateway) {}

  async emitOrderNew(payload: OrderNewPayload): Promise<void> {
    // Emit order.new event
    this.realtimeGateway.emitToRestaurant(payload.restaurantId, 'order.new', payload);

    // Also emit order.status.changed for DRAFT -> CONFIRMED transition
    this.realtimeGateway.emitToRestaurant(payload.restaurantId, 'order.status.changed', {
      orderId: payload.orderId,
      restaurantId: payload.restaurantId,
      previousStatus: 'DRAFT',
      newStatus: payload.status,
      updatedAt: payload.createdAt,
    });
  }

  async emitOrderItemStatusChanged(payload: OrderItemStatusChangedPayload): Promise<void> {
    this.realtimeGateway.emitToRestaurant(
      payload.restaurantId,
      'order.item.status.changed',
      payload,
    );
  }

  async emitOrderStatusChanged(payload: OrderStatusChangedPayload): Promise<void> {
    this.realtimeGateway.emitToRestaurant(payload.restaurantId, 'order.status.changed', payload);
  }
}
