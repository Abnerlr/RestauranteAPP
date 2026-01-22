# RestauranteApp - Web Dashboard

Next.js web application for restaurant owners and agents.

## Setup

1. Copia el archivo `.env.local.example` a `.env.local`:
```bash
cp .env.local.example .env.local
```

2. Ajusta las variables de entorno según tu configuración:
- `NEXT_PUBLIC_API_URL`: URL del backend REST API con prefijo `/api/v1` (default: http://localhost:3001/api/v1)
- `NEXT_PUBLIC_WS_URL`: URL del servidor WebSocket sin prefijo (default: http://localhost:3001)

**Ejemplo `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

## Desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Autenticación

La aplicación espera un JWT token guardado en `localStorage` con la key `auth_token`. 

Para desarrollo, puedes usar la pantalla de login en `/login` para ingresar un token manualmente.

El JWT debe incluir en su payload:
- `userId`: ID del usuario
- `role`: Rol del usuario (ADMIN, WAITER, KITCHEN, CASHIER)
- `restaurantId`: ID del restaurante

## Arquitectura WebSocket-First

La aplicación está diseñada con una arquitectura WebSocket-first:

- **WebSocket es la fuente de verdad**: Todos los eventos en tiempo real llegan por WebSocket
- **REST solo para snapshot inicial**: Se usa una sola vez al conectar para cargar el estado inicial
- **Sin polling**: No hay polling, todo es push por WebSocket
- **Dedupe de eventos**: Los eventos duplicados (por reconexión) se ignoran automáticamente
- **Estado normalizado**: Las órdenes se almacenan en un store normalizado con Zustand

## Rutas

- `/login`: Pantalla de login (placeholder)
- `/`: Redirige según el rol del usuario
- `/waiter`: Vista de mesero (coming soon)
- `/kitchen`: Vista de cocina (coming soon)
- `/cashier`: Vista de cajero (coming soon)
- `/debug/realtime`: Pantalla de debug para validar la conexión WebSocket y eventos en tiempo real

## Testing Real-time

Para probar la funcionalidad en tiempo real:

1. Abre `/debug/realtime` en dos pestañas diferentes con roles distintos
2. Crea o modifica una orden desde el backend o desde otra pestaña
3. Los eventos deberían aparecer en tiempo real en ambas pestañas
4. Verifica que no haya duplicados (el dedupe debería funcionar)
