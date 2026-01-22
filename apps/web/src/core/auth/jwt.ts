import { JwtPayload } from '@restaurante-app/contracts';

/**
 * Decodifica un JWT sin validar la firma (solo para extraer claims del cliente)
 * @param token JWT token
 * @returns Payload decodificado o null si es inválido
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decodificar el payload (segunda parte)
    const payload = parts[1];
    // Reemplazar caracteres base64url
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload) as JwtPayload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Valida que el payload del JWT contenga los campos requeridos
 * @param payload Payload decodificado del JWT
 * @returns true si el payload es válido, false en caso contrario
 */
export function validateJwtPayload(payload: JwtPayload | null): payload is JwtPayload {
  if (!payload) {
    return false;
  }

  // Requerir role y restaurantId (mínimo necesario)
  if (!payload.role || !payload.restaurantId) {
    return false;
  }

  // Verificar que exp no esté expirado (si existe)
  if (payload.exp) {
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return false;
    }
  }

  return true;
}
