'use client';

import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import { createSocket } from './socket.client';

// Singleton para mantener la instancia del socket fuera del estado serializable
let socketInstance: Socket | null = null;

interface SocketState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  error: string | null;
  lastError: string | null;

  connect: (token: string) => void;
  connectWithToken: (token: string) => void;
  disconnect: () => void;
  getSocket: () => Socket | null;
  getStatus: () => 'connected' | 'disconnected' | 'connecting';
}

export const useSocketStore = create<SocketState>((set, get) => ({
  status: 'disconnected',
  error: null,
  lastError: null,

  connect: (token: string) => {
    get().connectWithToken(token);
  },

  connectWithToken: (token: string) => {
    // Si ya hay una conexión, desconectar primero
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance.removeAllListeners();
      socketInstance = null;
    }

    if (!token || typeof token !== 'string' || !token.trim()) {
      set({ 
        status: 'error', 
        error: 'No token provided',
        lastError: 'No token provided',
      });
      return;
    }

    set({ status: 'connecting', error: null });

    try {
      const socket = createSocket(token.trim());
      socketInstance = socket;

      // Connect manually (since autoConnect: false)
      socket.connect();

      socket.on('connect', () => {
        console.log('[Socket] Connected successfully');
        set({ status: 'connected', error: null, lastError: null });
      });

      socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
        set({ status: 'disconnected', error: null });
      });

      socket.on('connect_error', (error) => {
        const errorMessage = error.message || 'Connection error';
        console.error('[Socket] Connect error:', errorMessage);
        set({ 
          status: 'error', 
          error: errorMessage,
          lastError: errorMessage,
        });
      });

      socket.on('error', (error) => {
        const errorMessage = error.message || 'Socket error';
        console.error('[Socket] Error:', errorMessage);
        set({ 
          status: 'error', 
          error: errorMessage,
          lastError: errorMessage,
        });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create socket';
      console.error('[Socket] Failed to create socket:', errorMessage);
      set({ 
        status: 'error', 
        error: errorMessage,
        lastError: errorMessage,
      });
    }
  },

  disconnect: () => {
    if (socketInstance) {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
      socketInstance = null;
    }
    set({ status: 'disconnected', error: null });
  },

  getSocket: () => socketInstance,

  getStatus: () => {
    const state = get();
    if (state.status === 'connected') return 'connected';
    if (state.status === 'connecting') return 'connecting';
    return 'disconnected';
  },
}));
