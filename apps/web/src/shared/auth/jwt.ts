/**
 * JWT utility functions (client-side only, no signature verification)
 */

/**
 * Checks if a string has JWT format (3 parts separated by dots)
 */
export function isJwtFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  const parts = token.split('.');
  return parts.length === 3;
}

/**
 * Decodes JWT payload without verifying signature
 * @param token JWT token string
 * @returns Decoded payload object or null if invalid
 */
export function decodeJwtPayload(token: string): any | null {
  try {
    if (!isJwtFormat(token)) {
      return null;
    }

    const parts = token.split('.');
    const payload = parts[1];
    
    // Replace base64url characters
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    
    // Decode base64
    const decoded = atob(padded);
    
    // Parse JSON
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding JWT payload:', error);
    return null;
  }
}

/**
 * Validates if a token is usable (format + decodable + has required fields)
 * @param token JWT token string
 * @returns Object with ok flag, optional reason, and optional payload
 */
export function isTokenUsable(token: string): {
  ok: boolean;
  reason?: string;
  payload?: any;
} {
  if (!token || typeof token !== 'string' || !token.trim()) {
    return { ok: false, reason: 'Token is empty or invalid type' };
  }

  const trimmed = token.trim();

  // Check JWT format
  if (!isJwtFormat(trimmed)) {
    return { ok: false, reason: 'Token does not have JWT format (expected 3 parts separated by dots)' };
  }

  // Try to decode
  const payload = decodeJwtPayload(trimmed);
  if (!payload) {
    return { ok: false, reason: 'Token payload cannot be decoded (invalid base64)' };
  }

  // Check for required fields (if they exist in the JWT structure)
  // For now, just check that it's decodable - role/restaurantId validation can be added if needed
  if (typeof payload !== 'object' || payload === null) {
    return { ok: false, reason: 'Token payload is not a valid object' };
  }

  return { ok: true, payload };
}
