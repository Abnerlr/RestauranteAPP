# Implementación WebSocket-First - Web App

## Resumen

Se ha implementado la base profesional "WebSocket-first" para la aplicación web Next.js con las siguientes características:

- ✅ Auth bootstrap (JWT desde localStorage)
- ✅ Conexión Socket.IO con JWT en handshake
- ✅ Suscripción a eventos: `order.new`, `order.item.status.changed`, `order.status.changed`
- ✅ Store central de órdenes (Zustand) normalizado con dedupe
- ✅ Bootstrap snapshot inicial por REST (una sola vez)
- ✅ Layout protegido que inicia todo automáticamente
- ✅ Pantalla de debug para validar realtime

## Archivos Creados/Modificados

### Core (Infraestructura Base)

1. **`src/core/auth/jwt.ts`**
   - Helper para decodificar JWT sin validar firma
   - Extrae claims del payload

2. **`src/core/auth/auth.store.ts`**
   - Store Zustand para autenticación
   - Maneja token, user, y status
   - `hydrateFromStorage()`: Lee JWT desde localStorage
   - `setToken()`: Guarda token y actualiza estado
   - `logout()`: Limpia storage y estado

3. **`src/core/api/http.ts`**
   - Cliente HTTP con autenticación JWT
   - Wrapper de fetch con baseUrl configurable
   - Agrega automáticamente `Authorization: Bearer <token>`
   - Helpers: `apiGet`, `apiPost`, `apiPatch`, `apiDelete`

4. **`src/core/socket/socket.client.ts`**
   - Factory para crear instancia Socket.IO
   - Configuración: transports websocket, auth con JWT, reconnection

5. **`src/core/socket/socket.store.ts`**
   - Store Zustand para estado de conexión WebSocket
   - Status: `disconnected` | `connecting` | `connected` | `error`
   - `connect(token)`: Conecta socket con JWT
   - `disconnect()`: Desconecta socket
   - `getSocket()`: Obtiene instancia singleton

### Features (Órdenes)

6. **`src/features/orders/api/orders.api.ts`**
   - `getActiveOrders()`: Obtiene órdenes activas vía REST
   - Endpoint: `GET /api/v1/orders/active`

7. **`src/features/orders/store/orders.store.ts`**
   - Store Zustand normalizado para órdenes
   - Estado:
     - `entities`: Record<orderId, Order>
     - `items`: Record<itemId, OrderItem>
     - `itemsByOrder`: Record<orderId, itemIds[]>
     - `indexByStatus`: Record<OrderStatus, orderIds[]>
     - `seenEventIds`: Record<eventId, true> (para dedupe)
   - Acciones:
     - `hydrateSnapshot(orders)`: Carga snapshot inicial
     - `applyOrderNew(payload)`: Aplica evento order.new
     - `applyItemStatusChanged(payload)`: Aplica evento order.item.status.changed
     - `applyOrderStatusChanged(payload)`: Aplica evento order.status.changed
   - Dedupe:
     - Genera IDs determinísticos para eventos
     - Ignora eventos duplicados
     - Verifica versión por `updatedAt` para ignorar eventos obsoletos
   - Helpers:
     - `getOrder(orderId)`
     - `getOrderWithItems(orderId)`
     - `getOrdersByStatus(status)`
     - `getAllOrderIds()`

8. **`src/features/orders/store/orders.ws.ts`**
   - Binder de eventos WebSocket al store
   - `bindOrderEvents(socket)`: Registra listeners y retorna cleanup
   - Usa constantes `WS_EVENTS` desde `@restaurante-app/contracts`

### App Router (Rutas)

9. **`src/app/(protected)/layout.tsx`**
   - Layout protegido (Client Component)
   - Al montar:
     - `hydrateFromStorage()` para leer JWT
     - Si no hay token → redirect a `/login`
     - Si hay token → conecta socket
   - Cuando socket se conecta:
     - Carga snapshot REST una sola vez
     - Bindea eventos WebSocket
   - Cleanup al desmontar

10. **`src/app/login/page.tsx`**
    - Pantalla de login (placeholder)
    - Permite ingresar JWT manualmente
    - Guarda en localStorage y redirige

11. **`src/app/(protected)/page.tsx`**
    - Página principal protegida
    - Redirige según rol:
      - `WAITER` → `/waiter`
      - `KITCHEN` → `/kitchen`
      - `CASHIER` → `/cashier`
      - `ADMIN` → `/waiter` (por defecto)

12. **`src/app/(protected)/waiter/page.tsx`**
    - Vista de mesero (placeholder)
    - Muestra estado WebSocket

13. **`src/app/(protected)/kitchen/page.tsx`**
    - Vista de cocina (placeholder)
    - Muestra estado WebSocket

14. **`src/app/(protected)/cashier/page.tsx`**
    - Vista de cajero (placeholder)
    - Muestra estado WebSocket

15. **`src/app/(protected)/debug/realtime/page.tsx`**
    - Pantalla de debug para validar realtime
    - Muestra:
      - Estado de conexión WebSocket
      - Total de órdenes
      - Conteo por status
      - Lista de últimas 10 órdenes
    - Se actualiza en vivo al recibir eventos

### Configuración

16. **`package.json`** (modificado)
    - Agregadas dependencias:
      - `@restaurante-app/contracts`: workspace:*
      - `socket.io-client`: ^4.7.2
      - `zustand`: ^4.4.7

17. **`README.md`** (modificado)
    - Documentación de setup
    - Variables de entorno
    - Arquitectura WebSocket-first
    - Instrucciones de testing

### Contracts (Mejoras)

18. **`packages/contracts/src/events/realtime.ts`** (modificado)
    - Agregadas constantes `WS_EVENTS` para nombres de eventos
    - Evita duplicación de strings

## Variables de Entorno

Crear archivo `.env.local` en `apps/web/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

## Instrucciones para Probar

### 1. Setup Inicial

```bash
# Desde la raíz del proyecto
pnpm install

# Desde apps/web
cd apps/web
pnpm dev
```

### 2. Obtener JWT Token

Necesitas un token JWT válido del backend. El token debe incluir en su payload:
- `userId`: string
- `role`: `ADMIN` | `WAITER` | `KITCHEN` | `CASHIER`
- `restaurantId`: string

Puedes obtenerlo haciendo login al backend o generándolo manualmente.

### 3. Probar Conexión WebSocket

1. Abre `http://localhost:3001/login` (o el puerto que Next.js asigne)
2. Pega tu JWT token y haz clic en "Iniciar Sesión"
3. Serás redirigido según tu rol
4. Navega a `/debug/realtime` para ver el estado de la conexión

### 4. Probar Real-time (2 Tabs)

1. Abre `/debug/realtime` en dos pestañas diferentes
2. Usa tokens con roles distintos (ej: WAITER y KITCHEN)
3. Ambas pestañas deberían:
   - Conectarse al WebSocket
   - Cargar el snapshot inicial
   - Mostrar el mismo número de órdenes

### 5. Probar Eventos en Tiempo Real

1. Desde el backend o desde otra herramienta, crea o modifica una orden
2. Los eventos deberían aparecer en tiempo real en ambas pestañas
3. Verifica que:
   - Los eventos se reciben correctamente
   - El store se actualiza sin duplicados
   - El dedupe funciona (reconexión no duplica eventos)

## Características Implementadas

### ✅ Sin Polling
- No hay polling, todo es push por WebSocket

### ✅ WebSocket es Fuente de Verdad
- Todos los eventos en tiempo real llegan por WebSocket
- REST solo se usa para el snapshot inicial

### ✅ Dedupe Funcional
- IDs determinísticos para eventos
- Ignora eventos duplicados (por reconexión)
- Verifica versión por `updatedAt` para ignorar eventos obsoletos

### ✅ Estado Normalizado
- Órdenes e items almacenados en estructura normalizada
- Índices por status para consultas rápidas
- Helpers para obtener órdenes con items

### ✅ Tipos Estrictos
- Todos los tipos importados desde `@restaurante-app/contracts`
- Nombres de eventos como constantes (`WS_EVENTS`)
- Sin strings mágicos

### ✅ Código Modular
- Lógica WS separada de UI
- Stores independientes y testeables
- Cleanup apropiado de listeners

## Próximos Pasos

- [ ] Implementar pantallas funcionales para cada rol
- [ ] Agregar manejo de errores más robusto
- [ ] Implementar retry manual para snapshot fallido
- [ ] Agregar tests unitarios para stores
- [ ] Agregar tests de integración para WebSocket
- [ ] Mejorar UI de debug screen
- [ ] Agregar indicadores visuales de conexión

## Notas

- El layout protegido mantiene la conexión WebSocket activa mientras estés en rutas protegidas
- Para MVP, la conexión se mantiene global (no se desconecta al cambiar de ruta)
- El snapshot se carga una sola vez cuando el socket se conecta
- Los eventos se procesan de forma idempotente (dedupe)
