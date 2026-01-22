import styles from './Badge.module.css';
import { cn } from './utils';

export type BadgeVariant = 'success' | 'warn' | 'danger' | 'info' | 'muted';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'muted', children, className }: BadgeProps) {
  return (
    <span className={cn(styles.badge, styles[variant], className)}>
      {children}
    </span>
  );
}
