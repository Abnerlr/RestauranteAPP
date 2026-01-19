// Authentication and authorization types

/**
 * User roles in the restaurant system
 */
export enum Role {
  ADMIN = 'ADMIN',
  WAITER = 'WAITER',
  KITCHEN = 'KITCHEN',
  CASHIER = 'CASHIER',
}

/**
 * JWT payload structure
 */
export interface JwtPayload {
  userId: string;
  role: Role;
  restaurantId: string;
}

/**
 * Current user context (extracted from JWT)
 */
export interface CurrentUser {
  userId: string;
  role: Role;
  restaurantId: string;
}
