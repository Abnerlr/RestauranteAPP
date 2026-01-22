/**
 * Environment configuration
 * Centralized URLs for API and WebSocket
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';
