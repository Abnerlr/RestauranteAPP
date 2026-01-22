'use client';

import { useEffect, useState } from 'react';
import { useKitchenOrders } from '@/features/orders/store/orders.selectors';
import { OrderCardKDS } from '@/features/orders/components/OrderCardKDS';
import { WS_EVENTS } from '@restaurante-app/contracts';
import { useSocketStore } from '@/core/socket/socket.store';
import styles from './kitchen.module.css';

export default function KitchenPage() {
  const { inProgress, ready, all } = useKitchenOrders();
  const { status: socketStatus, getSocket } = useSocketStore();
  const [highlightedOrders, setHighlightedOrders] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState<string>('');

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
    if (!socket) return;

    const handleOrderNew = (payload: any) => {
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
  }, [getSocket]);

  const isConnected = socketStatus === 'connected';

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
              />
              <span className={styles.statusText}>
                {isConnected ? 'Conectado' : 'Desconectado'}
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
