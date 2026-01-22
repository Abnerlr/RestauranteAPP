'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKitchenOrders } from '@/features/orders/store/orders.selectors';
import { OrderCardKDS } from '@/features/orders/components/OrderCardKDS';
import { WS_EVENTS } from '@restaurante-app/contracts';
import { useSocketStore } from '@/core/socket/socket.store';
import { useAuthStore } from '@/core/auth/auth.store';
import { getAuthToken, getRestaurantId } from '@/shared/auth/auth-helpers';
import { WS_URL } from '@/core/config/env';
import styles from './kitchen.module.css';

export default function KitchenPage() {
  const router = useRouter();
  const { inProgress, ready, all } = useKitchenOrders();
  const { status: socketStatus, error: socketError, connectWithToken, getSocket } = useSocketStore();
  const { token } = useAuthStore();
  const [highlightedOrders, setHighlightedOrders] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState<string>('');
  const [errorState, setErrorState] = useState<string | null>(null);

  // Verificar token y conectar socket al montar
  useEffect(() => {
    const authToken = token || getAuthToken();
    const restaurantId = getRestaurantId();

    // Verificar que hay token
    if (!authToken) {
      const errorMsg = 'No hay token de autenticación';
      console.error('[Kitchen]', errorMsg);
      setErrorState(errorMsg);
      router.replace('/login');
      return;
    }

    // Verificar que hay restaurantId
    if (!restaurantId) {
      const errorMsg = 'El token no contiene restaurantId';
      console.error('[Kitchen]', errorMsg);
      setErrorState(errorMsg);
      return;
    }

    // Verificar WS_URL
    if (!WS_URL) {
      const errorMsg = 'WS_URL no está configurado';
      console.error('[Kitchen]', errorMsg);
      setErrorState(errorMsg);
      return;
    }

    // Limpiar error si todo está bien
    setErrorState(null);

    // Conectar socket si no está conectado
    if (socketStatus === 'disconnected') {
      console.log('[Kitchen] Connecting socket...');
      connectWithToken(authToken);
    }
  }, [token, socketStatus, connectWithToken, router]);

  // Update current time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Listen for new orders to highlight
  useEffect(() => {
    const socket = getSocket();
    if (!socket || socketStatus !== 'connected') return;

    const handleOrderNew = (payload: any) => {
      console.log('[Kitchen] New order received:', payload.orderId);
      // Highlight new order for 3 seconds
      setHighlightedOrders((prev) => new Set(prev).add(payload.orderId));
      setTimeout(() => {
        setHighlightedOrders((prev) => {
          const next = new Set(prev);
          next.delete(payload.orderId);
          return next;
        });
      }, 3000);
    };

    socket.on(WS_EVENTS.ORDER_NEW, handleOrderNew);

    return () => {
      socket.off(WS_EVENTS.ORDER_NEW, handleOrderNew);
    };
  }, [getSocket, socketStatus]);

  const isConnected = socketStatus === 'connected';
  const isConnecting = socketStatus === 'connecting';
  const hasError = socketStatus === 'error';

  // Mostrar error si hay problema de configuración
  if (errorState) {
    return (
      <div className={styles.kitchenBoard}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>⚠️</div>
          <div className={styles.emptyTitle}>Error de configuración</div>
          <div className={styles.emptyDescription}>
            {errorState}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.kitchenBoard}>
      {/* Fixed Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Cocina</h1>
            <div className={styles.realtimeIndicator}>
              <span
                className={styles.statusDot}
                data-connected={isConnected}
                data-connecting={isConnecting}
                data-error={hasError}
              />
              <span className={styles.statusText}>
                {isConnected 
                  ? 'Conectado' 
                  : isConnecting 
                    ? 'Conectando...' 
                    : hasError 
                      ? `Error: ${socketError || 'WS'}` 
                      : 'Desconectado'}
              </span>
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.timeDisplay}>{currentTime}</div>
            <div className={styles.ordersCount}>
              {all.length} {all.length === 1 ? 'orden' : 'órdenes'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {all.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🍽️</div>
            <div className={styles.emptyTitle}>No hay órdenes en cocina</div>
            <div className={styles.emptyDescription}>
              Las nuevas órdenes aparecerán aquí en tiempo real
            </div>
          </div>
        ) : (
          <>
            {/* In Progress Section */}
            {inProgress.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>En Preparación</h2>
                  <span className={styles.sectionCount}>{inProgress.length}</span>
                </div>
                <div className={styles.ordersGrid}>
                  {inProgress.map((order) => (
                    <OrderCardKDS
                      key={order.id}
                      order={order}
                      highlight={highlightedOrders.has(order.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Ready Section */}
            {ready.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Listas</h2>
                  <span className={styles.sectionCount}>{ready.length}</span>
                </div>
                <div className={styles.ordersGrid}>
                  {ready.map((order) => (
                    <OrderCardKDS
                      key={order.id}
                      order={order}
                      highlight={highlightedOrders.has(order.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
