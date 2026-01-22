'use client';

import { useState } from 'react';
import { OrderItemStatus } from '@restaurante-app/contracts';
import { Card, CardHeader, CardTitle, CardContent } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { useOrdersStore } from '../store/orders.store';
import { updateOrderItemStatus } from '../api/orders.api';
import styles from './OrderCard.module.css';

interface OrderCardProps {
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
    }>;
  };
  highlight?: boolean;
}

function getOrderStatusVariant(status: string): 'success' | 'warn' | 'info' | 'muted' {
  switch (status) {
    case 'READY':
      return 'success';
    case 'IN_PROGRESS':
      return 'warn';
    case 'CONFIRMED':
      return 'info';
    default:
      return 'muted';
  }
}

function getItemStatusVariant(status: OrderItemStatus): 'success' | 'warn' | 'info' | 'muted' {
  switch (status) {
    case 'READY':
      return 'success';
    case 'IN_PROGRESS':
      return 'warn';
    case 'PENDING':
      return 'info';
    default:
      return 'muted';
  }
}

function getItemStatusLabel(status: OrderItemStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pendiente';
    case 'IN_PROGRESS':
      return 'Cocinando';
    case 'READY':
      return 'Listo';
    case 'CANCELLED':
      return 'Cancelado';
    default:
      return status;
  }
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

export function OrderCard({ order, highlight }: OrderCardProps) {
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
      // El evento WS llegará y reconciliará el estado
    } catch (error) {
      // Rollback en caso de error
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
  const orderTime = new Date(order.createdAt).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card highlight={highlight} className={styles.orderCard}>
      <CardHeader>
        <div className={styles.orderHeader}>
          <div>
            <CardTitle>Orden #{shortOrderId}</CardTitle>
            <div className={styles.orderMeta}>
              <span>Mesa: {order.tableSessionId.slice(-4)}</span>
              <span>•</span>
              <span>{orderTime}</span>
            </div>
          </div>
          <Badge variant={getOrderStatusVariant(order.status)}>
            {order.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className={styles.orderItems}>
          {order.items.map((item) => {
            const isUpdating = updatingItems.has(item.id);
            const error = errors[item.id];

            return (
              <div key={item.id} className={styles.orderItem}>
                <div className={styles.orderItemInfo}>
                  <span className={styles.orderItemName}>{item.name}</span>
                  <span className={styles.orderItemQty}>x{item.qty}</span>
                  <Badge variant={getItemStatusVariant(item.status)}>
                    {getItemStatusLabel(item.status)}
                  </Badge>
                </div>
                <div className={styles.orderItemActions}>
                  {item.status === OrderItemStatus.PENDING && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() =>
                        handleItemStatusChange(item.id, OrderItemStatus.IN_PROGRESS)
                      }
                      disabled={isUpdating}
                      aria-label={`Iniciar cocción de ${item.name}`}
                    >
                      Start
                    </Button>
                  )}
                  {item.status === OrderItemStatus.IN_PROGRESS && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() =>
                        handleItemStatusChange(item.id, OrderItemStatus.READY)
                      }
                      disabled={isUpdating}
                      aria-label={`Marcar ${item.name} como listo`}
                    >
                      Done
                    </Button>
                  )}
                  {error && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>
                      {error}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
