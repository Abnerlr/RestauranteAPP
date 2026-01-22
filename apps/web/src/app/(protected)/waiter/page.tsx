'use client';

import Link from 'next/link';
import { Badge } from '@/ui/Badge';
import { Card, CardContent } from '@/ui/Card';
import styles from './waiter.module.css';

export default function WaiterPage() {
  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Vista de Mesero</h1>
        <p className={styles.subtitle}>Módulo en construcción</p>
      </header>

      <Card>
        <CardContent>
          <div className={styles.content}>
            <p className={styles.description}>
              Esta vista estará disponible próximamente. Aquí podrás gestionar
              mesas, tomar órdenes y gestionar el servicio.
            </p>
            <div className={styles.actions}>
              <Link href="/debug/realtime" className={styles.link}>
                Ver Debug Real-time →
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
