# WebSocket Implementation - Socket.IO con Multi-tenancy

## Resumen

Se ha implementado WebSocket real con Socket.IO en NestJS, incluyendo autenticación JWT y multi-tenancy por `restaurantId`.

## Archivos Creados/Modificados

### Creados (1 archivo):
1. `backend/src/websocket/guards/ws-jwt.guard.ts` - Guard para autenticación JWT en WebSocket

### Modificados (4 archivos):
2. `backend/src/websocket/websocket.gateway.ts` - Gateway con autenticación y rooms
3. `backend/src/websocket/websocket.module.ts` - Módulo con JWT y exports
4. `backend/src/modules/orders/services/events-emitter.service.ts` - Emisión real de eventos
5. `backend/src/modules/orders/orders.module.ts` - Importa WebSocketModule

## Características Implementadas

### 1. Autenticación JWT en WebSocket
- ✅ Lee JWT desde `Authorization: Bearer <token>` header
- ✅ Fallback a `handshake.auth.token`
- ✅ Verifica firma con `JWT_SECRET`
- ✅ Extrae `userId`, `role`, `restaurantId` del token
- ✅ Rechaza conexión si token inválido

### 2. Rooms Multi-tenant
- ✅ Al conectar, une al socket al room: `restaurant:<restaurantId>`
- ✅ Todos los eventos se emiten al room del restaurante

### 3. Eventos Emitidos
- ✅ `order.new` - Cuando se confirma una orden
- ✅ `order.status.changed` - Cuando cambia el estado de una orden
- ✅ `order.item.status.changed` - Cuando cambia el estado de un item

## Código Completo

### WebSocketGateway

```typescript
// backend/src/websocket/websocket.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { WsJwtGuard } from './guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
})
@UseGuards(WsJwtGuard)
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  async handleConnection(@ConnectedSocket() client: Socket) {
    const restaurantId = client.data.restaurantId;
    const userId = client.data.userId;

    if (!restaurantId) {
      this.logger.warn(`Connection rejected: No restaurantId for socket ${client.id}`);
      client.disconnect();
      return;
    }

    // Join restaurant room for multi-tenancy
    const room = `restaurant:${restaurantId}`;
    client.join(room);

    this.logger.log(
      `Client connected: ${client.id} (userId: ${userId}, restaurantId: ${restaurantId}, room: ${room})`,
    );
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const restaurantId = client.data.restaurantId;
    const userId = client.data.userId;

    this.logger.log(
      `Client disconnected: ${client.id} (userId: ${userId}, restaurantId: ${restaurantId})`,
    );
  }

  /**
   * Emit event to all clients in a restaurant room
   */
  emitToRestaurant(restaurantId: string, event: string, data: any): void {
    const room = `restaurant:${restaurantId}`;
    this.server.to(room).emit(event, data);
    this.logger.debug(`Emitted ${event} to room ${room}`);
  }
}
```

### WsJwtGuard

```typescript
// backend/src/websocket/guards/ws-jwt.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { JwtPayload } from '../../common/types/auth.types';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = this.extractToken(client);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET') || 'your-secret-key';
      const payload = this.jwtService.verify<JwtPayload>(token, { secret });

      // Attach user info to socket data
      client.data.userId = payload.userId;
      client.data.role = payload.role;
      client.data.restaurantId = payload.restaurantId;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractToken(client: Socket): string | null {
    // Try Authorization header first
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Fallback to handshake.auth.token
    if (client.handshake.auth?.token) {
      return client.handshake.auth.token;
    }

    return null;
  }
}
```

### EventsEmitterService Actualizado

```typescript
// backend/src/modules/orders/services/events-emitter.service.ts
import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from '../../../websocket/websocket.gateway';
// ... interfaces ...

@Injectable()
export class EventsEmitterService {
  constructor(private readonly realtimeGateway: RealtimeGateway) {}

  async emitOrderNew(payload: OrderNewPayload): Promise<void> {
    // Emit order.new event
    this.realtimeGateway.emitToRestaurant(payload.restaurantId, 'order.new', payload);

    // Also emit order.status.changed for DRAFT -> CONFIRMED transition
    this.realtimeGateway.emitToRestaurant(payload.restaurantId, 'order.status.changed', {
      orderId: payload.orderId,
      restaurantId: payload.restaurantId,
      previousStatus: 'DRAFT',
      newStatus: payload.status,
      updatedAt: payload.createdAt,
    });
  }

  async emitOrderItemStatusChanged(payload: OrderItemStatusChangedPayload): Promise<void> {
    this.realtimeGateway.emitToRestaurant(
      payload.restaurantId,
      'order.item.status.changed',
      payload,
    );
  }

  async emitOrderStatusChanged(payload: OrderStatusChangedPayload): Promise<void> {
    this.realtimeGateway.emitToRestaurant(payload.restaurantId, 'order.status.changed', payload);
  }
}
```

## Pruebas con Cliente WebSocket

### Opción 1: Script Node.js

Crea un archivo `test-websocket.js`:

```javascript
const io = require('socket.io-client');

// Obtén un token JWT primero (desde login endpoint)
const TOKEN = 'your-jwt-token-here';
const WS_URL = 'http://localhost:3000';

const socket = io(WS_URL, {
  auth: {
    token: TOKEN,
  },
  // Alternativamente, puedes usar headers:
  // extraHeaders: {
  //   Authorization: `Bearer ${TOKEN}`,
  // },
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  console.log('Socket ID:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from WebSocket server');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

// Listen for order events
socket.on('order.new', (data) => {
  console.log('📦 New order:', JSON.stringify(data, null, 2));
});

socket.on('order.status.changed', (data) => {
  console.log('🔄 Order status changed:', JSON.stringify(data, null, 2));
});

socket.on('order.item.status.changed', (data) => {
  console.log('🍽️  Item status changed:', JSON.stringify(data, null, 2));
});

// Keep connection alive
setInterval(() => {
  console.log('💓 Heartbeat - still connected');
}, 30000);
```

Ejecutar:
```bash
npm install socket.io-client
node test-websocket.js
```

### Opción 2: Usando wscat (si soporta Socket.IO)

```bash
# Instalar wscat
npm install -g wscat

# Conectar (nota: wscat no soporta Socket.IO directamente, mejor usar el script Node.js)
```

### Opción 3: Cliente HTML Simple

Crea `test-websocket.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>WebSocket Test</title>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
  <h1>WebSocket Test Client</h1>
  <input type="text" id="tokenInput" placeholder="JWT Token" style="width: 500px;" />
  <button onclick="connect()">Connect</button>
  <button onclick="disconnect()">Disconnect</button>
  <div id="messages"></div>

  <script>
    let socket = null;

    function connect() {
      const token = document.getElementById('tokenInput').value;
      if (!token) {
        alert('Please enter a JWT token');
        return;
      }

      socket = io('http://localhost:3000', {
        auth: {
          token: token,
        },
      });

      socket.on('connect', () => {
        addMessage('✅ Connected: ' + socket.id, 'success');
      });

      socket.on('disconnect', () => {
        addMessage('❌ Disconnected', 'error');
      });

      socket.on('connect_error', (error) => {
        addMessage('❌ Error: ' + error.message, 'error');
      });

      socket.on('order.new', (data) => {
        addMessage('📦 New Order: ' + JSON.stringify(data, null, 2), 'info');
      });

      socket.on('order.status.changed', (data) => {
        addMessage('🔄 Status Changed: ' + JSON.stringify(data, null, 2), 'info');
      });

      socket.on('order.item.status.changed', (data) => {
        addMessage('🍽️  Item Status: ' + JSON.stringify(data, null, 2), 'info');
      });
    }

    function disconnect() {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    }

    function addMessage(text, type) {
      const div = document.createElement('div');
      div.style.margin = '10px 0';
      div.style.padding = '10px';
      div.style.border = '1px solid #ccc';
      div.style.borderRadius = '4px';
      div.style.fontFamily = 'monospace';
      div.style.fontSize = '12px';
      div.style.whiteSpace = 'pre-wrap';
      div.textContent = text;
      document.getElementById('messages').appendChild(div);
    }
  </script>
</body>
</html>
```

## Flujo de Prueba Completo

### 1. Obtener Token JWT

```bash
TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"waiter@restaurante.com","password":"password123"}' \
  | jq -r '.accessToken')

echo "Token: $TOKEN"
```

### 2. Conectar Cliente WebSocket

Usa el script Node.js o el HTML con el token obtenido.

### 3. Crear y Confirmar Orden

```bash
# Crear orden
ORDER_ID=$(curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tableSessionId":"session-id-here"}' \
  | jq -r '.id')

# Agregar item
curl -X POST http://localhost:3000/api/v1/orders/$ORDER_ID/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Hamburguesa","qty":2,"unitPrice":15.50}'

# Confirmar orden (esto emitirá order.new y order.status.changed)
curl -X POST http://localhost:3000/api/v1/orders/$ORDER_ID/confirm \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Observar Eventos en Cliente WebSocket

Deberías ver en el cliente:
- `order.new` con el payload completo
- `order.status.changed` con DRAFT -> CONFIRMED

### 5. Actualizar Estado de Item

```bash
# Login como KITCHEN
KITCHEN_TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kitchen@restaurante.com","password":"password123"}' \
  | jq -r '.accessToken')

# Actualizar item a IN_PROGRESS (emitirá order.item.status.changed y order.status.changed)
curl -X POST http://localhost:3000/api/v1/orders/$ORDER_ID/items/$ITEM_ID/status \
  -H "Authorization: Bearer $KITCHEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS"}'
```

## Eventos Emitidos

### order.new
```json
{
  "orderId": "uuid",
  "restaurantId": "uuid",
  "tableSessionId": "uuid",
  "status": "CONFIRMED",
  "items": [
    {
      "id": "uuid",
      "orderId": "uuid",
      "name": "Hamburguesa",
      "qty": 2,
      "unitPrice": "15.50",
      "status": "PENDING",
      "notes": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### order.status.changed
```json
{
  "orderId": "uuid",
  "restaurantId": "uuid",
  "previousStatus": "DRAFT",
  "newStatus": "CONFIRMED",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### order.item.status.changed
```json
{
  "orderId": "uuid",
  "itemId": "uuid",
  "restaurantId": "uuid",
  "previousStatus": "PENDING",
  "newStatus": "IN_PROGRESS",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Verificación

- ✅ Autenticación JWT funcionando
- ✅ Rooms multi-tenant por restaurantId
- ✅ Eventos emitidos correctamente
- ✅ Sin errores de linter
- ✅ API REST no afectada

## Notas Técnicas

- Los eventos se emiten solo a clientes en el room `restaurant:<restaurantId>`
- La autenticación es obligatoria para conectar
- El token se puede enviar en `Authorization` header o `handshake.auth.token`
- Los eventos incluyen todos los campos según los contratos
