// Order-related types

/**
 * Order status
 */
export enum OrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  READY = 'READY',
  CANCELLED = 'CANCELLED',
  CLOSED = 'CLOSED',
}

/**
 * Order item status
 */
export enum OrderItemStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  READY = 'READY',
  CANCELLED = 'CANCELLED',
}
