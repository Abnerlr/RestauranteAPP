/**
 * Authentication helpers
 * Centralized functions to get token and claims
 */

import { AUTH_LS_KEY } from './constants';
import { decodeJwtPayload } from './jwt';

/**
 * Gets the JWT token from localStorage
 * @returns Token string or null if not found
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_LS_KEY);
}

/**
 * Gets decoded JWT claims (payload)
 * @returns Decoded payload or null if token is invalid
 */
export function getAuthClaims(): any | null {
  const token = getAuthToken();
  if (!token) return null;
  return decodeJwtPayload(token);
}

/**
 * Gets restaurantId from JWT token
 * @returns restaurantId string or null if not found
 */
export function getRestaurantId(): string | null {
  const claims = getAuthClaims();
  return claims?.restaurantId || null;
}

/**
 * Gets role from JWT token
 * @returns role string or null if not found
 */
export function getRole(): string | null {
  const claims = getAuthClaims();
  return claims?.role || null;
}
