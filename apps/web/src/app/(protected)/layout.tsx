'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/core/auth/auth.store';
import { useSocketStore } from '@/core/socket/socket.store';
import { useOrdersStore } from '@/features/orders/store/orders.store';
import { getActiveOrders } from '@/features/orders/api/orders.api';
import { bindOrderEvents } from '@/features/orders/store/orders.ws';
import { AppShell } from '@/ui/AppShell';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { token, status: authStatus, hydrateFromStorage, user } = useAuthStore();
  const { status: socketStatus, connect, disconnect, getSocket } = useSocketStore();
  const { hydrateSnapshot } = useOrdersStore();
  const cleanupRef = useRef<(() => void) | null>(null);
  const snapshotLoadedRef = useRef(false);

  // Hydrate auth al montar
  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  // Verificar autenticación y conectar socket
  useEffect(() => {
    // Esperar un momento para que hydrateFromStorage termine
    const timer = setTimeout(() => {
      const currentState = useAuthStore.getState();
      if (currentState.status === 'anon' || !currentState.token) {
        router.replace('/login');
      }
    }, 100);
    return () => clearTimeout(timer);

    if (authStatus === 'authenticated' && token) {
      // Conectar socket si no está conectado
      if (socketStatus === 'disconnected') {
        connect(token);
      }
    }
  }, [authStatus, token, socketStatus, connect, router]);

  // Bootstrap: cargar snapshot y bindear eventos cuando socket se conecta
  useEffect(() => {
    if (socketStatus === 'connected' && !snapshotLoadedRef.current) {
      const socket = getSocket();
      if (!socket) return;

      // Cargar snapshot inicial
      getActiveOrders()
        .then((orders) => {
          console.log('[ProtectedLayout] Snapshot loaded:', orders.length, 'orders');
          hydrateSnapshot(orders);
          snapshotLoadedRef.current = true;
        })
        .catch((error) => {
          console.error('[ProtectedLayout] Failed to load snapshot:', error);
          // No bloquear la UI, pero registrar el error
        });

      // Bindear eventos WebSocket
      const cleanup = bindOrderEvents(socket);
      cleanupRef.current = cleanup;
    }
  }, [socketStatus, getSocket, hydrateSnapshot]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      // Opcional: desconectar socket al salir del layout
      // Para MVP, mantener conexión global
      // disconnect();
    };
  }, []);

  // Mostrar loading mientras se verifica auth
  if (authStatus === 'anon' || !token || !user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Verificando autenticación...</p>
      </div>
    );
  }

  return (
    <AppShell role={user.role} socketStatus={socketStatus}>
      {children}
    </AppShell>
  );
}
