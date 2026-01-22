import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

/**
 * Crea una instancia de Socket.IO con autenticación JWT
 * @param token JWT token para autenticación
 * @returns Instancia de Socket.IO
 */
export function createSocket(token: string): Socket {
  return io(WS_URL, {
    transports: ['websocket'],
    auth: {
      token,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
  });
}
