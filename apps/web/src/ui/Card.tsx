import { cn } from './utils';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  highlight?: boolean;
}

export function Card({ children, className, highlight }: CardProps) {
  return (
    <div className={cn(styles.card, highlight && styles.cardHighlight, className)}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return <div className={cn(styles.cardHeader, className)}>{children}</div>;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return <h3 className={cn(styles.cardTitle, className)}>{children}</h3>;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn(styles.cardContent, className)}>{children}</div>;
}
