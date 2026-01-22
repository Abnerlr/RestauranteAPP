'use client';

import { OrderStatus, OrderItemStatus } from '@restaurante-app/contracts';
import { cn } from '@/ui/utils';
import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: OrderStatus | OrderItemStatus;
  variant?: 'order' | 'item';
  className?: string;
}

export function StatusBadge({ status, variant = 'order', className }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case OrderStatus.READY:
      case OrderItemStatus.READY:
        return {
          label: variant === 'order' ? 'LISTO' : 'Listo',
          className: styles.ready,
        };
      case OrderStatus.IN_PROGRESS:
      case OrderItemStatus.IN_PROGRESS:
        return {
          label: variant === 'order' ? 'PREPARANDO' : 'Cocinando',
          className: styles.inProgress,
        };
      case OrderStatus.CONFIRMED:
      case OrderItemStatus.PENDING:
        return {
          label: variant === 'order' ? 'NUEVA' : 'Pendiente',
          className: styles.new,
        };
      case OrderStatus.CANCELLED:
      case OrderItemStatus.CANCELLED:
        return {
          label: 'CANCELADO',
          className: styles.cancelled,
        };
      default:
        return {
          label: status,
          className: styles.default,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={cn(styles.badge, config.className, className)}>
      {config.label}
    </span>
  );
}
