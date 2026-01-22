'use client';

import { useState, memo } from 'react';
import { OrderItemStatus } from '@restaurante-app/contracts';
import { StatusBadge } from './StatusBadge';
import { TimeBadge } from './TimeBadge';
import { useOrdersStore } from '../store/orders.store';
import { updateOrderItemStatus } from '../api/orders.api';
import styles from './OrderCardKDS.module.css';
import { cn } from '@/ui/utils';

interface OrderCardKDSProps {
  order: {
    id: string;
    status: string;
    tableSessionId: string;
    createdAt: string;
    updatedAt: string;
    items: Array<{
      id: string;
      name: string;
      qty: number;
      status: OrderItemStatus;
      notes?: string;
    }>;
  };
  highlight?: boolean;
}

function canTransitionTo(status: OrderItemStatus, target: OrderItemStatus): boolean {
  if (status === OrderItemStatus.PENDING && target === OrderItemStatus.IN_PROGRESS) {
    return true;
  }
  if (status === OrderItemStatus.IN_PROGRESS && target === OrderItemStatus.READY) {
    return true;
  }
  return false;
}

export const OrderCardKDS = memo(function OrderCardKDS({
  order,
  highlight,
}: OrderCardKDSProps) {
  const { setItemStatusOptimistic } = useOrdersStore();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleItemStatusChange = async (
    itemId: string,
    newStatus: OrderItemStatus
  ) => {
    const item = order.items.find((i) => i.id === itemId);
    if (!item || !canTransitionTo(item.status, newStatus)) {
      return;
    }

    setUpdatingItems((prev) => new Set(prev).add(itemId));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });

    // Optimistic update
    const { rollback } = setItemStatusOptimistic(order.id, itemId, newStatus);

    try {
      await updateOrderItemStatus(order.id, itemId, newStatus);
    } catch (error) {
      rollback();
      setErrors((prev) => ({
        ...prev,
        [itemId]: error instanceof Error ? error.message : 'Error al actualizar',
      }));
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const shortOrderId = order.id.slice(-6).toUpperCase();
  const tableNumber = order.tableSessionId.slice(-4);

  const allItemsReady = order.items.every((item) => item.status === OrderItemStatus.READY);
  const hasInProgress = order.items.some((item) => item.status === OrderItemStatus.IN_PROGRESS);

  return (
    <div
      className={cn(styles.orderCard, highlight && styles.highlight)}
      data-order-id={order.id}
    >
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.orderInfo}>
          <div className={styles.orderNumber}>#{shortOrderId}</div>
          <div className={styles.orderMeta}>
            <span className={styles.tableLabel}>Mesa {tableNumber}</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <TimeBadge createdAt={order.createdAt} />
          <StatusBadge status={order.status as any} variant="order" />
        </div>
      </div>

      {/* Items List */}
      <div className={styles.itemsList}>
        {order.items.map((item) => {
          const isUpdating = updatingItems.has(item.id);
          const error = errors[item.id];
          const isReady = item.status === OrderItemStatus.READY;
          const isInProgress = item.status === OrderItemStatus.IN_PROGRESS;
          const isPending = item.status === OrderItemStatus.PENDING;

          return (
            <div
              key={item.id}
              className={cn(
                styles.orderItem,
                isReady && styles.itemReady,
                isInProgress && styles.itemInProgress
              )}
            >
              <div className={styles.itemLeft}>
                <input
                  type="checkbox"
                  checked={isReady}
                  disabled={isUpdating || !isInProgress}
                  onChange={() => {
                    if (isInProgress) {
                      handleItemStatusChange(item.id, OrderItemStatus.READY);
                    }
                  }}
                  className={styles.itemCheckbox}
                  aria-label={`Marcar ${item.name} como listo`}
                />
                <div className={styles.itemInfo}>
                  <div className={styles.itemName}>
                    <span className={styles.itemQty}>x{item.qty}</span>
                    {item.name}
                  </div>
                  {item.notes && (
                    <div className={styles.itemNotes}>{item.notes}</div>
                  )}
                </div>
              </div>
              <div className={styles.itemRight}>
                {isPending && (
                  <button
                    className={cn(styles.actionButton, styles.startButton)}
                    onClick={() => handleItemStatusChange(item.id, OrderItemStatus.IN_PROGRESS)}
                    disabled={isUpdating}
                    aria-label={`Iniciar cocción de ${item.name}`}
                  >
                    Iniciar
                  </button>
                )}
                {isInProgress && (
                  <button
                    className={cn(styles.actionButton, styles.readyButton)}
                    onClick={() => handleItemStatusChange(item.id, OrderItemStatus.READY)}
                    disabled={isUpdating}
                    aria-label={`Marcar ${item.name} como listo`}
                  >
                    Listo
                  </button>
                )}
                {isReady && (
                  <StatusBadge status={item.status} variant="item" />
                )}
                {error && (
                  <span className={styles.errorText}>{error}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {allItemsReady && (
        <div className={styles.cardFooter}>
          <div className={styles.readyIndicator}>
            ✓ Todos los items están listos
          </div>
        </div>
      )}
    </div>
  );
});
