# Orders Module Implementation

## Resumen

Se ha implementado el módulo completo de Orders para RestauranteApp con todos los endpoints, validaciones de estado, transacciones y soporte para WebSocket (stubs).

## Archivos Creados/Modificados

### Creados (12 archivos):

1. `backend/src/modules/orders/dto/create-order.dto.ts`
2. `backend/src/modules/orders/dto/add-order-item.dto.ts`
3. `backend/src/modules/orders/dto/update-order-item.dto.ts`
4. `backend/src/modules/orders/dto/update-item-status.dto.ts`
5. `backend/src/modules/orders/dto/order-item-response.dto.ts`
6. `backend/src/modules/orders/dto/order-response.dto.ts`
7. `backend/src/modules/orders/services/events-emitter.service.ts`
8. `backend/src/modules/orders/orders.service.ts`
9. `backend/src/modules/orders/orders.controller.ts`
10. `backend/src/modules/orders/orders.module.ts`

### Modificados (1 archivo):

11. `backend/src/app.module.ts` - Agregado OrdersModule

## Endpoints Implementados

### 1. POST /api/v1/orders
Crea una nueva orden en estado DRAFT.

**Roles:** ADMIN, WAITER

### 2. POST /api/v1/orders/:orderId/items
Agrega un item a una orden.

**Roles:** ADMIN, WAITER

### 3. PATCH /api/v1/orders/:orderId/items/:itemId
Actualiza un item de una orden.

**Roles:** ADMIN, WAITER

### 4. DELETE /api/v1/orders/:orderId/items/:itemId
Cancela un item (soft delete).

**Roles:** ADMIN, WAITER

### 5. POST /api/v1/orders/:orderId/confirm
Confirma una orden (DRAFT -> CONFIRMED).

**Roles:** ADMIN, WAITER

### 6. GET /api/v1/orders/active
Obtiene todas las órdenes activas.

**Roles:** ADMIN, WAITER, KITCHEN, CASHIER

### 7. POST /api/v1/orders/:orderId/items/:itemId/status
Actualiza el estado de un item.

**Roles:** ADMIN, KITCHEN

### 8. POST /api/v1/orders/:orderId/close
Cierra una orden (READY -> CLOSED).

**Roles:** ADMIN, CASHIER

## Comandos para Probar

### Prerequisitos

1. Backend corriendo: `pnpm dev`
2. Base de datos migrada
3. Usuarios creados (admin, waiter, kitchen, cashier)
4. Mesa y sesión de mesa creadas

### Variables de Entorno

```bash
BASE_URL="http://localhost:3000"
```

### Flujo Completo de Prueba

#### 1. Login como WAITER

```bash
WAITER_TOKEN=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"waiter@restaurante.com","password":"password123"}' \
  | jq -r '.accessToken')

echo "Waiter token: ${WAITER_TOKEN:0:20}..."
```

#### 2. Obtener TableSession ID

```bash
# Primero necesitas abrir una sesión de mesa
# Asumiendo que ya tienes una sesión abierta
TABLE_SESSION_ID="your-table-session-id-here"
```

#### 3. Crear Orden (POST /api/v1/orders)

```bash
ORDER_RESPONSE=$(curl -s -X POST $BASE_URL/api/v1/orders \
  -H "Authorization: Bearer $WAITER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"tableSessionId\": \"$TABLE_SESSION_ID\",
    \"notes\": \"Mesa 1 - Cliente especial\"
  }")

ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.id')
echo "Order creada - ID: $ORDER_ID"
echo "Estado: $(echo $ORDER_RESPONSE | jq -r '.status')"
echo "Respuesta completa:"
echo $ORDER_RESPONSE | jq
```

#### 4. Agregar Items (POST /api/v1/orders/:orderId/items)

```bash
# Item 1
ITEM1_RESPONSE=$(curl -s -X POST $BASE_URL/api/v1/orders/$ORDER_ID/items \
  -H "Authorization: Bearer $WAITER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hamburguesa Clásica",
    "qty": 2,
    "unitPrice": 15.50,
    "notes": "Sin cebolla"
  }')

ITEM1_ID=$(echo $ITEM1_RESPONSE | jq -r '.id')
echo "Item 1 agregado - ID: $ITEM1_ID"
echo $ITEM1_RESPONSE | jq

# Item 2
ITEM2_RESPONSE=$(curl -s -X POST $BASE_URL/api/v1/orders/$ORDER_ID/items \
  -H "Authorization: Bearer $WAITER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Papas Fritas",
    "qty": 1,
    "unitPrice": 5.00
  }')

ITEM2_ID=$(echo $ITEM2_RESPONSE | jq -r '.id')
echo "Item 2 agregado - ID: $ITEM2_ID"
echo $ITEM2_RESPONSE | jq
```

#### 5. Actualizar Item (PATCH /api/v1/orders/:orderId/items/:itemId)

```bash
UPDATED_ITEM=$(curl -s -X PATCH $BASE_URL/api/v1/orders/$ORDER_ID/items/$ITEM1_ID \
  -H "Authorization: Bearer $WAITER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "qty": 3,
    "notes": "Sin cebolla, extra queso"
  }')

echo "Item actualizado:"
echo $UPDATED_ITEM | jq
```

#### 6. Confirmar Orden (POST /api/v1/orders/:orderId/confirm)

```bash
CONFIRMED_ORDER=$(curl -s -X POST $BASE_URL/api/v1/orders/$ORDER_ID/confirm \
  -H "Authorization: Bearer $WAITER_TOKEN" \
  -H "Content-Type: application/json")

echo "Orden confirmada:"
echo $CONFIRMED_ORDER | jq
echo "Estado: $(echo $CONFIRMED_ORDER | jq -r '.status')"
echo "ConfirmedAt: $(echo $CONFIRMED_ORDER | jq -r '.confirmedAt')"
```

#### 7. Login como KITCHEN

```bash
KITCHEN_TOKEN=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kitchen@restaurante.com","password":"password123"}' \
  | jq -r '.accessToken')

echo "Kitchen token: ${KITCHEN_TOKEN:0:20}..."
```

#### 8. Actualizar Estado de Item a IN_PROGRESS (POST /api/v1/orders/:orderId/items/:itemId/status)

```bash
ITEM_IN_PROGRESS=$(curl -s -X POST $BASE_URL/api/v1/orders/$ORDER_ID/items/$ITEM1_ID/status \
  -H "Authorization: Bearer $KITCHEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_PROGRESS"
  }')

echo "Item en progreso:"
echo $ITEM_IN_PROGRESS | jq
echo "Estado del item: $(echo $ITEM_IN_PROGRESS | jq -r '.status')"

# Verificar que la orden cambió a IN_PROGRESS automáticamente
ACTIVE_ORDERS=$(curl -s -X GET "$BASE_URL/api/v1/orders/active" \
  -H "Authorization: Bearer $KITCHEN_TOKEN")

ORDER_STATUS=$(echo $ACTIVE_ORDERS | jq -r ".[] | select(.id == \"$ORDER_ID\") | .status")
echo "Estado de la orden: $ORDER_STATUS (debe ser IN_PROGRESS)"
```

#### 9. Actualizar Estado de Item a READY

```bash
ITEM_READY=$(curl -s -X POST $BASE_URL/api/v1/orders/$ORDER_ID/items/$ITEM1_ID/status \
  -H "Authorization: Bearer $KITCHEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "READY"
  }')

echo "Item listo:"
echo $ITEM_READY | jq

# Actualizar segundo item a READY
ITEM2_READY=$(curl -s -X POST $BASE_URL/api/v1/orders/$ORDER_ID/items/$ITEM2_ID/status \
  -H "Authorization: Bearer $KITCHEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "READY"
  }')

echo "Item 2 listo:"
echo $ITEM2_READY | jq

# Verificar que la orden cambió a READY automáticamente (cuando todos los items están READY)
ACTIVE_ORDERS=$(curl -s -X GET "$BASE_URL/api/v1/orders/active" \
  -H "Authorization: Bearer $KITCHEN_TOKEN")

ORDER_STATUS=$(echo $ACTIVE_ORDERS | jq -r ".[] | select(.id == \"$ORDER_ID\") | .status")
echo "Estado de la orden: $ORDER_STATUS (debe ser READY)"
```

#### 10. Login como CASHIER

```bash
CASHIER_TOKEN=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cashier@restaurante.com","password":"password123"}' \
  | jq -r '.accessToken')

echo "Cashier token: ${CASHIER_TOKEN:0:20}..."
```

#### 11. Cerrar Orden (POST /api/v1/orders/:orderId/close)

```bash
CLOSED_ORDER=$(curl -s -X POST $BASE_URL/api/v1/orders/$ORDER_ID/close \
  -H "Authorization: Bearer $CASHIER_TOKEN" \
  -H "Content-Type: application/json")

echo "Orden cerrada:"
echo $CLOSED_ORDER | jq
echo "Estado: $(echo $CLOSED_ORDER | jq -r '.status')"
echo "ClosedAt: $(echo $CLOSED_ORDER | jq -r '.closedAt')"
```

#### 12. Ver Órdenes Activas (GET /api/v1/orders/active)

```bash
# Todas las activas
ACTIVE_ORDERS=$(curl -s -X GET "$BASE_URL/api/v1/orders/active" \
  -H "Authorization: Bearer $WAITER_TOKEN")

echo "Órdenes activas:"
echo $ACTIVE_ORDERS | jq

# Filtrar por status
CONFIRMED_ORDERS=$(curl -s -X GET "$BASE_URL/api/v1/orders/active?status=CONFIRMED" \
  -H "Authorization: Bearer $WAITER_TOKEN")

echo "Órdenes confirmadas:"
echo $CONFIRMED_ORDERS | jq

# Filtrar por tableSessionId
SESSION_ORDERS=$(curl -s -X GET "$BASE_URL/api/v1/orders/active?tableSessionId=$TABLE_SESSION_ID" \
  -H "Authorization: Bearer $WAITER_TOKEN")

echo "Órdenes de la sesión:"
echo $SESSION_ORDERS | jq
```

### Pruebas de Validación

#### Intentar agregar item a orden no-DRAFT

```bash
# Esto debe fallar con 409 Conflict
curl -s -X POST $BASE_URL/api/v1/orders/$ORDER_ID/items \
  -H "Authorization: Bearer $WAITER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Item extra",
    "qty": 1
  }' | jq
```

#### Intentar confirmar orden sin items

```bash
# Crear orden vacía
EMPTY_ORDER=$(curl -s -X POST $BASE_URL/api/v1/orders \
  -H "Authorization: Bearer $WAITER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tableSessionId\": \"$TABLE_SESSION_ID\"}")

EMPTY_ORDER_ID=$(echo $EMPTY_ORDER | jq -r '.id')

# Intentar confirmar (debe fallar con 400 Bad Request)
curl -s -X POST $BASE_URL/api/v1/orders/$EMPTY_ORDER_ID/confirm \
  -H "Authorization: Bearer $WAITER_TOKEN" \
  -H "Content-Type: application/json" | jq
```

#### Intentar transición de estado inválida

```bash
# Intentar cambiar READY -> PENDING (debe fallar)
curl -s -X POST $BASE_URL/api/v1/orders/$ORDER_ID/items/$ITEM1_ID/status \
  -H "Authorization: Bearer $KITCHEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PENDING"
  }' | jq
```

## Características Implementadas

✅ **Multi-tenancy**: Todos los endpoints filtran por `restaurantId` del JWT  
✅ **Validación de roles**: Guards aplicados según contratos  
✅ **Validación de estados**: Transiciones de estado validadas  
✅ **Transacciones atómicas**: Operaciones críticas en transacciones Prisma  
✅ **Auto-actualización de estados**: Order status se actualiza automáticamente según items  
✅ **WebSocket stubs**: EventsEmitterService listo para implementar WebSocket  
✅ **Validación de DTOs**: class-validator en todos los DTOs  
✅ **Mapeo de Decimal**: unitPrice convertido a string en responses  

## Notas Técnicas

- Los items solo son editables cuando `Order.status === DRAFT`
- El evento `order.new` se emite al confirmar (no al crear DRAFT)
- Los estados de orden se actualizan automáticamente:
  - `CONFIRMED` -> `IN_PROGRESS` cuando un item pasa a `IN_PROGRESS`
  - `IN_PROGRESS` -> `READY` cuando todos los items no-cancelled están `READY`
- Las transiciones de estado de items están validadas según las reglas del MVP
