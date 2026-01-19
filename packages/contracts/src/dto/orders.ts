// Order-related DTOs

import { OrderStatus, OrderItemStatus } from '../types';

/**
 * Create order request DTO
 */
export interface CreateOrderDto {
  tableSessionId: string;
  notes?: string;
}

/**
 * Add order item request DTO
 */
export interface AddOrderItemDto {
  name: string;
  qty: number;
  unitPrice?: number;
  notes?: string;
}

/**
 * Update order item request DTO
 */
export interface UpdateOrderItemDto {
  name?: string;
  qty?: number;
  unitPrice?: number;
  notes?: string;
}

/**
 * Confirm order request DTO (empty body)
 */
export interface ConfirmOrderDto {
  // Empty - no additional data required
}

/**
 * Change item status request DTO
 */
export interface ChangeItemStatusDto {
  status: OrderItemStatus;
}

/**
 * Close order request DTO (empty body)
 */
export interface CloseOrderDto {
  // Empty - no additional data required
}

/**
 * Order item response DTO
 */
export interface OrderItemResponseDto {
  id: string;
  orderId: string;
  name: string;
  qty: number;
  unitPrice?: string; // Decimal as string
  status: OrderItemStatus;
  notes?: string;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

/**
 * Order response DTO
 */
export interface OrderResponseDto {
  id: string;
  restaurantId: string;
  tableSessionId: string;
  createdByUserId: string;
  status: OrderStatus;
  notes?: string;
  confirmedAt?: string; // ISO 8601 timestamp
  closedAt?: string; // ISO 8601 timestamp
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  items: OrderItemResponseDto[];
}
