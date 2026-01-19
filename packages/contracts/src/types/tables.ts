// Table and session-related types

/**
 * Table status
 */
export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  CLEANING = 'CLEANING',
}

/**
 * Session status (table session)
 */
export enum SessionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CHECKOUT_REQUESTED = 'CHECKOUT_REQUESTED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
}
