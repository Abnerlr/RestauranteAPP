# WebSocket Smoke Test

## Objetivo

Verificar que los eventos WebSocket se emiten correctamente y se reciben en el room del restaurant correspondiente.

## Prerequisitos

1. Backend corriendo: `pnpm dev`
2. Base de datos migrada y con datos de prueba
3. Usuarios creados (waiter, kitchen, cashier) para el mismo restaurant
4. Mesa y sesión de mesa creadas

## Configuración

```bash
BASE_URL="http://localhost:3000"
```

## Paso 1: Preparar Tokens

### Obtener tokens para diferentes roles del mismo restaurant

```bash
# Token WAITER
WAITER_TOKEN=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"waiter@restaurante.com","password":"password123"}' \
  | jq -r '.accessToken')

echo "Waiter token: ${WAITER_TOKEN:0:20}..."

# Token KITCHEN
KITCHEN_TOKEN=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kitchen@restaurante.com","password":"password123"}' \
  | jq -r '.accessToken')

echo "Kitchen token: ${KITCHEN_TOKEN:0:20}..."

# Token CASHIER
CASHIER_TOKEN=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cashier@restaurante.com","password":"password123"}' \
  | jq -r '.accessToken')

echo "Cashier token: ${CASHIER_TOKEN:0:20}..."
```

## Paso 2: Conectar Cliente WebSocket

En una terminal separada, ejecuta el cliente WebSocket:

```bash
node backend/test-websocket.js "$WAITER_TOKEN"
```

Deberías ver:
```
🔌 Connecting to WebSocket server: http://localhost:3000
🔑 Using token: eyJhbGciOiJIUzI1NiIs...
✅ Connected to WebSocket server
📡 Socket ID: <socket-id>
⏳ Waiting for events...
```

**Mantén esta terminal abierta** para observar los eventos.

## Paso 3: Crear y Confirmar Orden (order.new + order.status.changed)

En otra terminal, ejecuta:

```bash
# Obtener table session ID (asumiendo que ya tienes una sesión abierta)
TABLE_SESSION_ID=$(curl -s -X GET $BASE_URL/api/v1/table-sessions/active \
  -H "Authorization: Bearer $WAITER_TOKEN" \
  | jq -r '.[0].id')

if [ -z "$TABLE_SESSION_ID" ] || [ "$TABLE_SESSION_ID" = "null" ]; then
  echo "❌ No active table session found. Please open a table session first."
  exit 1
fi

echo "Using table session: $TABLE_SESSION_ID"

# Crear orden
ORDER_RESPONSE=$(curl -s -X POST $BASE_URL/api/v1/orders \
  -H "Authorization: Bearer $WAITER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tableSessionId\": \"$TABLE_SESSION_ID\"}")

ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.id')
echo "Order created: $ORDER_ID"

# Agregar item
ITEM_RESPONSE=$(curl -s -X POST $BASE_URL/api/v1/orders/$ORDER_ID/items \
  -H "Authorization: Bearer $WAITER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Hamburguesa Clásica","qty":2,"unitPrice":15.50}')

ITEM_ID=$(echo $ITEM_RESPONSE | jq -r '.id')
echo "Item added: $ITEM_ID"

# Confirmar orden (esto debe emitir order.new y order.status.changed)
echo "Confirming order..."
curl -s -X POST $BASE_URL/api/v1/orders/$ORDER_ID/confirm \
  -H "Authorization: Bearer $WAITER_TOKEN" \
  -H "Content-Type: application/json"
```

### Verificación en Cliente WebSocket

En la terminal del cliente WebSocket, deberías ver:

```
📦 [order.new]
{
  "orderId": "<uuid>",
  "restaurantId": "<uuid>",
  "tableSessionId": "<uuid>",
  "status": "CONFIRMED",
  "items": [
    {
      "id": "<uuid>",
      "orderId": "<uuid>",
      "name": "Hamburguesa Clásica",
      "qty": 2,
      "unitPrice": "15.50",
      "status": "PENDING",
      ...
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z"
}

🔄 [order.status.changed]
{
  "orderId": "<uuid>",
  "restaurantId": "<uuid>",
  "previousStatus": "DRAFT",
  "newStatus": "CONFIRMED",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

✅ **Verificar:**
- Ambos eventos se reciben
- `orderId` y `restaurantId` coinciden
- `order.new` incluye el array de `items`
- `order.status.changed` muestra la transición DRAFT -> CONFIRMED

## Paso 4: Actualizar Estado de Item (order.item.status.changed + order.status.changed)

```bash
# Actualizar item a IN_PROGRESS (debe emitir order.item.status.changed y order.status.changed)
echo "Updating item to IN_PROGRESS..."
curl -s -X POST $BASE_URL/api/v1/orders/$ORDER_ID/items/$ITEM_ID/status \
  -H "Authorization: Bearer $KITCHEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS"}'
```

### Verificación en Cliente WebSocket

Deberías ver:

```
🍽️  [order.item.status.changed]
{
  "orderId": "<uuid>",
  "itemId": "<uuid>",
  "restaurantId": "<uuid>",
  "previousStatus": "PENDING",
  "newStatus": "IN_PROGRESS",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}

🔄 [order.status.changed]
{
  "orderId": "<uuid>",
  "restaurantId": "<uuid>",
  "previousStatus": "CONFIRMED",
  "newStatus": "IN_PROGRESS",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

✅ **Verificar:**
- `order.item.status.changed` se recibe con previousStatus y newStatus correctos
- `order.status.changed` muestra la transición CONFIRMED -> IN_PROGRESS (auto-update)

## Paso 5: Actualizar Item a READY (order.item.status.changed + order.status.changed)

```bash
# Actualizar item a READY (debe emitir order.item.status.changed)
# Si todos los items están READY, también debe emitir order.status.changed IN_PROGRESS -> READY
echo "Updating item to READY..."
curl -s -X POST $BASE_URL/api/v1/orders/$ORDER_ID/items/$ITEM_ID/status \
  -H "Authorization: Bearer $KITCHEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"READY"}'
```

### Verificación en Cliente WebSocket

Deberías ver:

```
🍽️  [order.item.status.changed]
{
  "orderId": "<uuid>",
  "itemId": "<uuid>",
  "restaurantId": "<uuid>",
  "previousStatus": "IN_PROGRESS",
  "newStatus": "READY",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}

🔄 [order.status.changed]
{
  "orderId": "<uuid>",
  "restaurantId": "<uuid>",
  "previousStatus": "IN_PROGRESS",
  "newStatus": "READY",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

✅ **Verificar:**
- `order.item.status.changed` se recibe
- `order.status.changed` muestra la transición IN_PROGRESS -> READY (auto-update cuando todos los items están READY)

## Paso 6: Cerrar Orden (order.status.changed)

```bash
# Cerrar orden (debe emitir order.status.changed)
echo "Closing order..."
curl -s -X POST $BASE_URL/api/v1/orders/$ORDER_ID/close \
  -H "Authorization: Bearer $CASHIER_TOKEN" \
  -H "Content-Type: application/json"
```

### Verificación en Cliente WebSocket

Deberías ver:

```
🔄 [order.status.changed]
{
  "orderId": "<uuid>",
  "restaurantId": "<uuid>",
  "previousStatus": "READY",
  "newStatus": "CLOSED",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

✅ **Verificar:**
- `order.status.changed` se recibe con la transición READY -> CLOSED

## Paso 7: Verificar Multi-tenancy (Opcional)

Para verificar que los eventos solo se reciben en el room correcto:

1. **Conectar cliente con token de otro restaurant:**
   ```bash
   # En otra terminal, obtener token de otro restaurant
   OTHER_RESTAURANT_TOKEN=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"waiter@otrorestaurante.com","password":"password123"}' \
     | jq -r '.accessToken')
   
   # Conectar cliente WebSocket
   node backend/test-websocket.js "$OTHER_RESTAURANT_TOKEN"
   ```

2. **Crear orden en el primer restaurant:**
   ```bash
   # Usar el mismo ORDER_ID del paso 3
   # Este evento NO debe aparecer en el cliente del otro restaurant
   ```

✅ **Verificar:**
- El cliente del otro restaurant NO recibe eventos del primer restaurant
- Solo el cliente del mismo restaurant recibe los eventos

## Checklist de Verificación

- [ ] Cliente WebSocket se conecta correctamente
- [ ] `order.new` se emite al confirmar orden
- [ ] `order.status.changed` se emite al confirmar (DRAFT -> CONFIRMED)
- [ ] `order.item.status.changed` se emite al cambiar estado de item
- [ ] `order.status.changed` se emite automáticamente cuando corresponde (CONFIRMED -> IN_PROGRESS, IN_PROGRESS -> READY)
- [ ] `order.status.changed` se emite al cerrar orden (READY -> CLOSED)
- [ ] Todos los eventos incluyen `restaurantId` correcto
- [ ] Eventos solo se reciben en el room del restaurant correspondiente (multi-tenancy)

## Troubleshooting

### Cliente no se conecta
- Verificar que el token JWT es válido y no está expirado
- Verificar que el backend está corriendo
- Revisar logs del backend para ver errores de autenticación

### Eventos no se reciben
- Verificar que el cliente está conectado (debe mostrar "Connected")
- Verificar que el `restaurantId` en los eventos coincide con el del token
- Revisar logs del backend para ver si los eventos se están emitiendo

### Eventos se reciben en múltiples restaurants
- Verificar que el `restaurantId` en el JWT es correcto
- Verificar que el room es `restaurant:<restaurantId>`
- Revisar que no hay múltiples conexiones con diferentes tokens

## Script Completo de Prueba

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

# 1. Obtener tokens
WAITER_TOKEN=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"waiter@restaurante.com","password":"password123"}' \
  | jq -r '.accessToken')

KITCHEN_TOKEN=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kitchen@restaurante.com","password":"password123"}' \
  | jq -r '.accessToken')

CASHIER_TOKEN=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cashier@restaurante.com","password":"password123"}' \
  | jq -r '.accessToken')

# 2. Obtener table session
TABLE_SESSION_ID=$(curl -s -X GET $BASE_URL/api/v1/table-sessions/active \
  -H "Authorization: Bearer $WAITER_TOKEN" \
  | jq -r '.[0].id')

# 3. Crear orden
ORDER_ID=$(curl -s -X POST $BASE_URL/api/v1/orders \
  -H "Authorization: Bearer $WAITER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tableSessionId\": \"$TABLE_SESSION_ID\"}" \
  | jq -r '.id')

# 4. Agregar item
ITEM_ID=$(curl -s -X POST $BASE_URL/api/v1/orders/$ORDER_ID/items \
  -H "Authorization: Bearer $WAITER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Item","qty":1,"unitPrice":10.00}' \
  | jq -r '.id')

# 5. Confirmar (debe emitir order.new y order.status.changed)
echo "Confirming order..."
curl -s -X POST $BASE_URL/api/v1/orders/$ORDER_ID/confirm \
  -H "Authorization: Bearer $WAITER_TOKEN"

sleep 2

# 6. Actualizar item a IN_PROGRESS
echo "Updating item to IN_PROGRESS..."
curl -s -X POST $BASE_URL/api/v1/orders/$ORDER_ID/items/$ITEM_ID/status \
  -H "Authorization: Bearer $KITCHEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS"}'

sleep 2

# 7. Actualizar item a READY
echo "Updating item to READY..."
curl -s -X POST $BASE_URL/api/v1/orders/$ORDER_ID/items/$ITEM_ID/status \
  -H "Authorization: Bearer $KITCHEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"READY"}'

sleep 2

# 8. Cerrar orden
echo "Closing order..."
curl -s -X POST $BASE_URL/api/v1/orders/$ORDER_ID/close \
  -H "Authorization: Bearer $CASHIER_TOKEN"

echo ""
echo "✅ Test completed. Check WebSocket client for events."
```
