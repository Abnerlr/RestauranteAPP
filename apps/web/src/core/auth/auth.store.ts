'use client';

import { create } from 'zustand';
import { Role, JwtPayload } from '@restaurante-app/contracts';
import { decodeJwt, validateJwtPayload } from './jwt';
import { AUTH_TOKEN_KEY } from './constants';

interface AuthState {
  token: string | null;
  user: {
    role: Role;
    restaurantId: string;
    userId: string;
  } | null;
  status: 'anon' | 'authenticated';

  hydrateFromStorage: () => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  status: 'anon',

  hydrateFromStorage: () => {
    if (typeof window === 'undefined') return;

    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!storedToken) {
      set({ token: null, user: null, status: 'anon' });
      return;
    }

    const payload = decodeJwt(storedToken);
    if (!payload || !validateJwtPayload(payload)) {
      // Token inválido, limpiar
      localStorage.removeItem(AUTH_TOKEN_KEY);
      set({ token: null, user: null, status: 'anon' });
      return;
    }

    set({
      token: storedToken,
      user: {
        role: payload.role,
        restaurantId: payload.restaurantId,
        userId: payload.userId,
      },
      status: 'authenticated',
    });
  },

  setToken: (token: string) => {
    if (typeof window === 'undefined') return;

    const payload = decodeJwt(token);
    if (!payload || !validateJwtPayload(payload)) {
      console.error('Invalid token provided');
      throw new Error('Token inválido: debe contener role y restaurantId');
    }

    localStorage.setItem(AUTH_TOKEN_KEY, token);
    set({
      token,
      user: {
        role: payload.role,
        restaurantId: payload.restaurantId,
        userId: payload.userId,
      },
      status: 'authenticated',
    });
  },

  logout: () => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(AUTH_TOKEN_KEY);
    set({ token: null, user: null, status: 'anon' });
  },
}));
