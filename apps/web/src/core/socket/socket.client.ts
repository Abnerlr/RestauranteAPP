import { io, Socket } from 'socket.io-client';
import { WS_URL } from '../config/env';

/**
 * Crea una instancia de Socket.IO con autenticación JWT
 * @param token JWT token para autenticación (raw JWT string)
 * @returns Instancia de Socket.IO
 */
export function createSocket(token: string): Socket {
  return io(WS_URL, {
    transports: ['websocket'],
    autoConnect: false, // Connect manually with connectWithToken
    auth: {
      token, // Send raw JWT string in handshake.auth.token
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
  });
}
