'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/core/auth/auth.store';
import { Role } from '@restaurante-app/contracts';

export default function ProtectedHomePage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Redirigir según el rol
    switch (user.role) {
      case Role.WAITER:
        router.push('/waiter');
        break;
      case Role.KITCHEN:
        router.push('/kitchen');
        break;
      case Role.CASHIER:
        router.push('/cashier');
        break;
      case Role.ADMIN:
        // Admin puede ir a cualquier vista, por defecto waiter
        router.push('/waiter');
        break;
      default:
        router.push('/login');
    }
  }, [user, router]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Redirigiendo...</p>
    </div>
  );
}
