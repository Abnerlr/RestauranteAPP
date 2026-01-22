// Real-time WebSocket event definitions

import { OrderStatus, OrderItemStatus } from '../types';
import { OrderItemResponseDto } from '../dto/orders';

/**
 * WebSocket event names
 */
export const WS_EVENTS = {
  ORDER_NEW: 'order.new',
  ORDER_STATUS_CHANGED: 'order.status.changed',
  ORDER_ITEM_STATUS_CHANGED: 'order.item.status.changed',
  TABLE_CHECKOUT_REQUESTED: 'table.checkout.requested',
  PAYMENT_COMPLETED: 'payment.completed',
} as const;

/**
 * order.new event payload
 * Emitted when an order is confirmed (POST /api/v1/orders/:orderId/confirm)
 * This event is sent to the kitchen to notify that a new order is ready for preparation
 */
export interface OrderNewEvent {
  orderId: string;
  restaurantId: string;
  tableSessionId: string;
  tableNumber?: number; // Optional table number for display
  status: OrderStatus; // Always CONFIRMED when this event is emitted
  items: OrderItemResponseDto[];
  createdAt: string; // ISO 8601 timestamp
}

/**
 * order.status.changed event payload
 * Emitted when an order status changes
 */
export interface OrderStatusChangedEvent {
  orderId: string;
  restaurantId: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  updatedAt: string; // ISO 8601 timestamp
}

/**
 * order.item.status.changed event payload
 * Emitted when an order item status changes
 */
export interface OrderItemStatusChangedEvent {
  orderId: string;
  itemId: string;
  restaurantId: string;
  previousStatus: OrderItemStatus;
  newStatus: OrderItemStatus;
  updatedAt: string; // ISO 8601 timestamp
}

/**
 * table.checkout.requested event payload
 * Emitted when a table checkout is requested
 */
export interface TableCheckoutRequestedEvent {
  tableId: string;
  restaurantId: string;
  sessionId: string;
  requestedBy: string; // User ID
  requestedAt: string; // ISO 8601 timestamp
}

/**
 * payment.completed event payload
 * Emitted when a payment is completed
 */
export interface PaymentCompletedEvent {
  paymentId: string;
  restaurantId: string;
  orderId: string;
  amount: number;
  method: string; // Payment method
  completedAt: string; // ISO 8601 timestamp
}
