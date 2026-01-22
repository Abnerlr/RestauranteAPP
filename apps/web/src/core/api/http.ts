/**
 * HTTP client con autenticación JWT
 */

import { AUTH_TOKEN_KEY } from '@/core/auth/constants';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export interface ApiError {
  message: string;
  status: number;
  statusText: string;
}

/**
 * Obtiene el token de autenticación desde localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Realiza una petición HTTP autenticada
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  const url = `${API_URL}${endpoint}`;
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error: ApiError = {
      message: `HTTP ${response.status}: ${response.statusText}`,
      status: response.status,
      statusText: response.statusText,
    };

    try {
      const errorBody = await response.json();
      if (errorBody.message) {
        error.message = errorBody.message;
      }
    } catch {
      // Ignorar si no hay JSON en el error
    }

    throw error;
  }

  // Si la respuesta está vacía, retornar void
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return response.json();
}

/**
 * GET request
 */
export function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * POST request
 */
export function apiPost<T>(endpoint: string, body?: unknown): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PATCH request
 */
export function apiPatch<T>(endpoint: string, body?: unknown): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request
 */
export function apiDelete<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}
