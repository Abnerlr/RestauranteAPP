'use client';

import { useSocketStore } from '@/core/socket/socket.store';
import { useOrdersStore } from '@/features/orders/store/orders.store';
import { useAuthStore } from '@/core/auth/auth.store';
import { getAuthToken, getRestaurantId, getRole } from '@/shared/auth/auth-helpers';
import { WS_URL } from '@/core/config/env';
import { OrderStatus } from '@restaurante-app/contracts';

export default function RealtimeDebugPage() {
  const { status: socketStatus, error: socketError, lastError, getSocket } = useSocketStore();
  const { user, token } = useAuthStore();
  const {
    entities,
    indexByStatus,
    getAllOrderIds,
    getOrderWithItems,
  } = useOrdersStore();

  // Debug info del token
  const authToken = token || getAuthToken();
  const tokenPresent = !!authToken;
  const restaurantId = getRestaurantId();
  const role = getRole();
  const socket = getSocket();
  const listenersCount = socket ? socket.listeners('connect').length + socket.listeners('disconnect').length : 0;

  const allOrderIds = getAllOrderIds();
  const last10OrderIds = allOrderIds.slice(-10).reverse();

  // Contar órdenes por status
  const countsByStatus = {
    [OrderStatus.DRAFT]: indexByStatus[OrderStatus.DRAFT].length,
    [OrderStatus.CONFIRMED]: indexByStatus[OrderStatus.CONFIRMED].length,
    [OrderStatus.IN_PROGRESS]: indexByStatus[OrderStatus.IN_PROGRESS].length,
    [OrderStatus.READY]: indexByStatus[OrderStatus.READY].length,
    [OrderStatus.CANCELLED]: indexByStatus[OrderStatus.CANCELLED].length,
    [OrderStatus.CLOSED]: indexByStatus[OrderStatus.CLOSED].length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return '#22c55e';
      case 'connecting':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Debug: Real-time WebSocket</h1>

      {/* Estado de Autenticación */}
      <section style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
        <h2 style={{ marginTop: 0 }}>Estado de Autenticación</h2>
        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <strong>Token presente:</strong>{' '}
            <code style={{ color: tokenPresent ? '#22c55e' : '#ef4444' }}>
              {tokenPresent ? 'Sí' : 'No'}
            </code>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <strong>Restaurant ID:</strong>{' '}
            <code style={{ color: restaurantId ? '#22c55e' : '#ef4444' }}>
              {restaurantId || 'N/A'}
            </code>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <strong>Role:</strong>{' '}
            <code>{role || 'N/A'}</code>
          </div>
          {user && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
              <strong>Usuario (store):</strong> {user.userId} | <strong>Rol:</strong> {user.role} |{' '}
              <strong>Restaurant:</strong> {user.restaurantId}
            </div>
          )}
        </div>
      </section>

      {/* Estado de conexión */}
      <section style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
        <h2 style={{ marginTop: 0 }}>Estado de Conexión WebSocket</h2>
        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: getStatusColor(socketStatus),
              }}
            />
            <strong>Socket Status:</strong> <code>{socketStatus}</code>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <strong>WS URL:</strong> <code style={{ fontSize: '0.875rem' }}>{WS_URL || 'Not configured'}</code>
          </div>
          {socketError && (
            <div style={{ marginTop: '0.5rem', color: '#ef4444' }}>
              <strong>Error actual:</strong> {socketError}
            </div>
          )}
          {lastError && (
            <div style={{ marginTop: '0.5rem', color: '#f59e0b' }}>
              <strong>Último error:</strong> {lastError}
            </div>
          )}
          {socket && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
              <strong>Socket ID:</strong> {socket.id || 'Not connected'} |{' '}
              <strong>Connected:</strong> {socket.connected ? 'Yes' : 'No'} |{' '}
              <strong>Listeners:</strong> {listenersCount}
            </div>
          )}
          {restaurantId && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
              <strong>Room esperado:</strong> <code>restaurant:{restaurantId}</code>
              <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#999' }}>
                (El backend hace join automático en el middleware de autenticación)
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Estadísticas de órdenes */}
      <section style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
        <h2 style={{ marginTop: 0 }}>Estadísticas de Órdenes</h2>
        <div style={{ marginTop: '1rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            Total: <strong>{allOrderIds.length}</strong> órdenes
          </div>
          <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            {Object.entries(countsByStatus).map(([status, count]) => (
              <div
                key={status}
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div style={{ fontSize: '0.875rem', color: '#666' }}>{status}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginTop: '0.25rem' }}>
                  {count}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Últimas 10 órdenes */}
      <section style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
        <h2 style={{ marginTop: 0 }}>Últimas 10 Órdenes</h2>
        {last10OrderIds.length === 0 ? (
          <p style={{ marginTop: '1rem', color: '#666' }}>No hay órdenes cargadas</p>
        ) : (
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {last10OrderIds.map((orderId) => {
              const order = getOrderWithItems(orderId);
              if (!order) return null;

              return (
                <div
                  key={orderId}
                  style={{
                    padding: '1rem',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>Order ID:</strong> <code style={{ fontSize: '0.875rem' }}>{orderId}</code>
                    </div>
                    <div
                      style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                      }}
                    >
                      {order.status}
                    </div>
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                    <div>
                      <strong>Items:</strong> {order.items.length} | <strong>Table Session:</strong>{' '}
                      {order.tableSessionId}
                    </div>
                    <div style={{ marginTop: '0.25rem' }}>
                      <strong>Updated:</strong> {new Date(order.updatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Instrucciones */}
      <section style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0 }}>Cómo probar:</h3>
        <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
          <li>Abre esta página en dos pestañas diferentes con roles distintos (ej: WAITER y KITCHEN)</li>
          <li>Ambas deberían conectarse al WebSocket y cargar el snapshot inicial</li>
          <li>Crea o modifica una orden desde el backend o desde otra pestaña</li>
          <li>Los eventos deberían aparecer en tiempo real en ambas pestañas</li>
          <li>Verifica que no haya duplicados (dedupe funcionando)</li>
        </ol>
      </section>
    </div>
  );
}
