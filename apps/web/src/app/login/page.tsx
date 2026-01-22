'use client';

import { useState, useEffect, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AUTH_LS_KEY, AUTH_COOKIE } from '@/shared/auth/constants';
import { isTokenUsable, isJwtFormat } from '@/shared/auth/jwt';
import { Card, CardHeader, CardTitle, CardContent } from '@/ui/Card';
import { Button } from '@/ui/Button';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Debug state
  const [debugInfo, setDebugInfo] = useState({
    tokenLength: 0,
    isJwtFormat: false,
    savedToLocalStorage: false,
    cookieSet: false,
    lastAction: 'idle',
  });

  // Verificar si ya hay token válido al cargar
  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_LS_KEY);
    if (storedToken) {
      const validation = isTokenUsable(storedToken);
      if (validation.ok) {
        setDebugInfo(prev => ({ ...prev, lastAction: 'auto-redirecting' }));
        router.replace('/kitchen');
      }
    }
  }, [router]);

  // Actualizar debug info cuando cambia el input
  useEffect(() => {
    const trimmed = tokenInput.trim();
    setDebugInfo(prev => ({
      ...prev,
      tokenLength: trimmed.length,
      isJwtFormat: isJwtFormat(trimmed),
    }));
  }, [tokenInput]);

  // Verificar localStorage y cookie en debug
  useEffect(() => {
    const checkStorage = () => {
      const hasLS = !!localStorage.getItem(AUTH_LS_KEY);
      const hasCookie = document.cookie.includes(`${AUTH_COOKIE}=`);
      setDebugInfo(prev => ({
        ...prev,
        savedToLocalStorage: hasLS,
        cookieSet: hasCookie,
      }));
    };
    
    checkStorage();
    // Revisar periódicamente para debug
    const interval = setInterval(checkStorage, 500);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = () => {
    if (!tokenInput.trim()) {
      setError('Por favor ingresa un token');
      setDebugInfo(prev => ({ ...prev, lastAction: 'error: empty token' }));
      return;
    }

    setIsLoading(true);
    setError(null);
    setDebugInfo(prev => ({ ...prev, lastAction: 'validating' }));

    try {
      const trimmedToken = tokenInput.trim();
      
      // Validar token
      const validation = isTokenUsable(trimmedToken);
      
      if (!validation.ok) {
        setError(validation.reason || 'Token inválido');
        setIsLoading(false);
        setDebugInfo(prev => ({ ...prev, lastAction: `invalid token: ${validation.reason}` }));
        return;
      }

      // Guardar en localStorage
      localStorage.setItem(AUTH_LS_KEY, trimmedToken);
      
      // Guardar en cookie
      document.cookie = `${AUTH_COOKIE}=${trimmedToken}; Path=/; SameSite=Lax; Max-Age=604800`;
      
      setDebugInfo(prev => ({
        ...prev,
        savedToLocalStorage: true,
        cookieSet: true,
        lastAction: 'saved, navigating',
      }));

      // Navegar a /kitchen
      router.replace('/kitchen');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar el token';
      setError(errorMessage);
      setIsLoading(false);
      setDebugInfo(prev => ({ ...prev, lastAction: `error: ${errorMessage}` }));
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleLogin();
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <p className={styles.subtitle}>Acceso al panel del restaurante</p>
        </CardHeader>
        <CardContent>
          <div className={styles.form}>
            <label htmlFor="token-input" className={styles.label}>
              Token JWT
            </label>
            <textarea
              id="token-input"
              value={tokenInput}
              onChange={(e) => {
                setTokenInput(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Pega tu JWT token aquí..."
              className={styles.textarea}
              disabled={isLoading}
              rows={6}
            />

            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}

            <Button
              onClick={handleLogin}
              disabled={!tokenInput.trim() || isLoading}
              className={styles.button}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>

            <p className={styles.note}>
              Presiona <kbd>Ctrl+Enter</kbd> o <kbd>Cmd+Enter</kbd> para enviar
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Debug Panel */}
      <Card className={styles.debugCard}>
        <CardHeader>
          <CardTitle style={{ fontSize: '0.875rem', fontWeight: 600 }}>Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.debugGrid}>
            <div className={styles.debugItem}>
              <span className={styles.debugLabel}>Token Length:</span>
              <span className={styles.debugValue}>{debugInfo.tokenLength}</span>
            </div>
            <div className={styles.debugItem}>
              <span className={styles.debugLabel}>Is JWT Format:</span>
              <span className={styles.debugValue} style={{ color: debugInfo.isJwtFormat ? '#22c55e' : '#ef4444' }}>
                {debugInfo.isJwtFormat ? 'true' : 'false'}
              </span>
            </div>
            <div className={styles.debugItem}>
              <span className={styles.debugLabel}>Saved to localStorage:</span>
              <span className={styles.debugValue} style={{ color: debugInfo.savedToLocalStorage ? '#22c55e' : '#ef4444' }}>
                {debugInfo.savedToLocalStorage ? 'true' : 'false'}
              </span>
            </div>
            <div className={styles.debugItem}>
              <span className={styles.debugLabel}>Cookie Set:</span>
              <span className={styles.debugValue} style={{ color: debugInfo.cookieSet ? '#22c55e' : '#ef4444' }}>
                {debugInfo.cookieSet ? 'true' : 'false'}
              </span>
            </div>
            <div className={styles.debugItem} style={{ gridColumn: '1 / -1' }}>
              <span className={styles.debugLabel}>Last Action:</span>
              <span className={styles.debugValue} style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {debugInfo.lastAction}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className={styles.footerNote}>
        Esta es una pantalla temporal. En producción, el login debería ser manejado por un proveedor de autenticación.
      </p>
    </div>
  );
}
