'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/core/auth/auth.store';

export default function Home() {
  const router = useRouter();
  const { token, status: authStatus, hydrateFromStorage } = useAuthStore();

  useEffect(() => {
    // Hydrate auth desde localStorage
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    // Esperar un momento para que hydrateFromStorage termine
    const timer = setTimeout(() => {
      const currentToken = useAuthStore.getState().token;
      
      if (!currentToken) {
        // No hay token, redirigir a login
        router.replace('/login');
      } else {
        // Hay token, redirigir al área protegida (que redirige según rol)
        router.replace('/kitchen');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [router, authStatus, token]);

  // Mostrar loading mientras se verifica
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <p style={{ color: '#666' }}>Cargando...</p>
    </div>
  );
}
