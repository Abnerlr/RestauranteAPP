'use client';

import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import { createSocket } from './socket.client';

// Singleton para mantener la instancia del socket fuera del estado serializable
let socketInstance: Socket | null = null;

interface SocketState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  error: string | null;

  connect: (token: string) => void;
  disconnect: () => void;
  getSocket: () => Socket | null;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  status: 'disconnected',
  error: null,

  connect: (token: string) => {
    // Si ya hay una conexión, desconectar primero
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }

    set({ status: 'connecting', error: null });

    try {
      const socket = createSocket(token);
      socketInstance = socket;

      socket.on('connect', () => {
        set({ status: 'connected', error: null });
      });

      socket.on('disconnect', () => {
        set({ status: 'disconnected' });
      });

      socket.on('connect_error', (error) => {
        set({ status: 'error', error: error.message });
      });

      socket.on('error', (error) => {
        set({ status: 'error', error: error.message || 'Socket error' });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create socket';
      set({ status: 'error', error: errorMessage });
    }
  },

  disconnect: () => {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }
    set({ status: 'disconnected', error: null });
  },

  getSocket: () => socketInstance,
}));
