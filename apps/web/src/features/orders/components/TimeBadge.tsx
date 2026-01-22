'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/ui/utils';
import styles from './TimeBadge.module.css';

interface TimeBadgeProps {
  createdAt: string;
  className?: string;
}

export function TimeBadge({ createdAt, className }: TimeBadgeProps) {
  const [elapsed, setElapsed] = useState<string>('');

  useEffect(() => {
    const updateElapsed = () => {
      const now = new Date().getTime();
      const created = new Date(createdAt).getTime();
      const diff = Math.floor((now - created) / 1000); // seconds

      if (diff < 60) {
        setElapsed(`${diff}s`);
      } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        setElapsed(`${minutes}:${seconds.toString().padStart(2, '0')}m`);
      } else {
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        setElapsed(`${hours}:${minutes.toString().padStart(2, '0')}h`);
      }
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  // Determine urgency: > 10 minutes = urgent (orange), > 5 minutes = warning (yellow), else normal (green/blue)
  const minutes = Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / 60000);
  const isUrgent = minutes >= 10;
  const isWarning = minutes >= 5 && minutes < 10;

  return (
    <span
      className={cn(
        styles.timeBadge,
        isUrgent && styles.urgent,
        isWarning && styles.warning,
        !isUrgent && !isWarning && styles.normal,
        className
      )}
    >
      {elapsed}
    </span>
  );
}
