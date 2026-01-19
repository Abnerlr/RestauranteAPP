# Concurrency Hardening - Orders Module

## Resumen

Se ha implementado control de concurrencia robusto para todas las operaciones críticas del módulo Orders, utilizando:

- **Transacciones atómicas** (`prisma.$transaction`)
- **Advisory locks** de PostgreSQL (`pg_advisory_xact_lock`)
- **Optimistic locking** con `updateMany` condicionado por estado previo
- **Verificación de count** para detectar modificaciones concurrentes

## Archivos Modificados

1. `backend/src/modules/orders/orders.service.ts` - Todos los métodos críticos protegidos

## Métodos Protegidos

### 1. `addItem()` - Agregar item a orden

**Protección:**
- Advisory lock en order
- Verificación atómica de que order.status === DRAFT dentro de transacción
- Creación de item dentro de la misma transacción

**Casos que devuelven 409:**
- Order no está en DRAFT status (fue modificado concurrentemente)

### 2. `updateItem()` - Actualizar item

**Protección:**
- Advisory lock en order
- Verificación atómica de que order.status === DRAFT dentro de transacción
- Update atómico con `updateMany` condicionado: solo si item.status !== CANCELLED

**Casos que devuelven 409:**
- Order no está en DRAFT status (fue modificado concurrentemente)
- Item está CANCELLED (fue cancelado concurrentemente)
- Item fue modificado concurrentemente (count !== 1)

### 3. `deleteItem()` - Cancelar item (soft delete)

**Protección:**
- Advisory lock en order
- Verificación atómica de que order.status está en ['DRAFT', 'CONFIRMED'] dentro de transacción
- Update atómico con `updateMany` condicionado: solo si item.status !== CANCELLED

**Casos que devuelven 409:**
- Order no está en DRAFT o CONFIRMED status (fue modificado concurrentemente)
- Item ya está CANCELLED (fue cancelado concurrentemente)
- Item fue modificado concurrentemente (count !== 1)

### 4. `confirm()` - Confirmar orden

**Protección:**
- Advisory lock en order
- Update atómico con `updateMany` condicionado: solo si order.status === DRAFT

**Casos que devuelven 409:**
- Order no está en DRAFT status (fue confirmado/modificado concurrentemente)
- Order fue modificado concurrentemente (count !== 1)

**Validaciones previas (fuera de transacción, pero necesarias):**
- Order debe tener al menos 1 item
- No puede tener items CANCELLED
- Todos los items deben estar en PENDING

### 5. `updateItemStatus()` - Actualizar estado de item

**Protección:**
- Advisory lock en order
- Update atómico con `updateMany` condicionado: solo si item.status === previousStatus
- Auto-update de order.status con `updateMany` condicionado:
  - Si item -> IN_PROGRESS y order.status === CONFIRMED => order -> IN_PROGRESS
  - Si item -> READY y order.status === IN_PROGRESS y todos items READY => order -> READY

**Casos que devuelven 409:**
- Order no está en CONFIRMED o IN_PROGRESS status
- Item status cambió concurrentemente (count !== 1)
- Transición de estado inválida (validación previa)

**Eventos WS emitidos:**
- `order.item.status.changed` - Siempre que el update del item sea exitoso
- `order.status.changed` - Solo si el order.status cambió (count === 1)

### 6. `close()` - Cerrar orden

**Protección:**
- Advisory lock en order
- Update atómico con `updateMany` condicionado: solo si order.status === READY

**Casos que devuelven 409:**
- Order no está en READY status (fue modificado concurrentemente)
- Order fue modificado concurrentemente (count !== 1)

**Validaciones previas (fuera de transacción, pero necesarias):**
- Todos los items no CANCELLED deben estar en READY

## Estrategia de Concurrencia

### Advisory Locks

Todos los métodos críticos usan `pg_advisory_xact_lock` con la clave `order:${orderId}`:

```typescript
await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`order:${orderId}`}))`;
```

**Ventajas:**
- Serializa todas las operaciones sobre la misma orden
- Se libera automáticamente al finalizar la transacción
- No bloquea otras órdenes (solo la orden específica)

### Optimistic Locking

Se usa `updateMany` con condiciones para verificar el estado previo:

```typescript
const updateCount = await tx.order.updateMany({
  where: {
    id: orderId,
    restaurantId,
    status: 'DRAFT', // Condición: solo actualiza si está en este estado
  },
  data: { status: 'CONFIRMED' },
});

if (updateCount.count !== 1) {
  throw new ConflictException('Order was modified concurrently');
}
```

**Ventajas:**
- Detecta modificaciones concurrentes
- No requiere campos de versión adicionales
- Funciona bien con advisory locks

### Transacciones

Todas las operaciones críticas están envueltas en `prisma.$transaction`:

```typescript
const result = await this.prisma.$transaction(async (tx) => {
  // Advisory lock
  // Verificaciones atómicas
  // Updates condicionados
  // Retorno de datos actualizados
});
```

**Ventajas:**
- Atomicidad: todo o nada
- Aislamiento: cambios no visibles hasta commit
- Consistencia: estado válido siempre

## Eventos WebSocket

Los eventos WS se emiten **SOLO después de que la transacción confirme exitosamente**:

### `order.new`
- Emitido en `confirm()` después de actualizar order a CONFIRMED
- Payload incluye: orderId, restaurantId, tableSessionId, status, items[], createdAt

### `order.item.status.changed`
- Emitido en `updateItemStatus()` después de actualizar item status
- Payload incluye: orderId, itemId, restaurantId, previousStatus, newStatus, updatedAt

### `order.status.changed`
- Emitido en:
  - `confirm()`: DRAFT -> CONFIRMED (dentro de emitOrderNew)
  - `updateItemStatus()`: cuando order.status cambia automáticamente
  - `close()`: READY -> CLOSED
- Payload incluye: orderId, restaurantId, previousStatus, newStatus, updatedAt

**Importante:** Si la transacción falla, NO se emiten eventos.

## Casos de Conflicto (409 ConflictException)

### Por Método

#### `addItem()`
- `"Cannot add items to order that is not in DRAFT status"` - Order fue confirmado/modificado concurrentemente

#### `updateItem()`
- `"Cannot update items in order that is not in DRAFT status"` - Order fue confirmado/modificado concurrentemente
- `"Cannot update cancelled item"` - Item fue cancelado concurrentemente
- `"Item was modified concurrently"` - Item fue modificado por otra operación

#### `deleteItem()`
- `"Cannot cancel items from order that is not in DRAFT or CONFIRMED status"` - Order fue modificado concurrentemente
- `"Item is already cancelled"` - Item fue cancelado concurrentemente
- `"Item was modified concurrently"` - Item fue modificado por otra operación

#### `confirm()`
- `"Order is not in DRAFT status or was already modified"` - Order fue confirmado/modificado concurrentemente
- `"Cannot confirm order with cancelled items"` - Validación previa (no concurrente)
- `"All items must be in PENDING status to confirm order"` - Validación previa (no concurrente)

#### `updateItemStatus()`
- `"Cannot update item status when order is in ${status} status. Order must be CONFIRMED or IN_PROGRESS."` - Order fue modificado concurrentemente
- `"Item status changed concurrently. Expected ${previousStatus}, but item was modified."` - Item fue modificado concurrentemente
- `"Invalid status transition from ${currentStatus} to ${newStatus}"` - Validación previa (no concurrente)

#### `close()`
- `"Order is not in READY status or was already modified"` - Order fue modificado concurrentemente
- `"All items must be READY before closing order"` - Validación previa (no concurrente)

## Multi-tenancy

**TODOS** los `where` clauses incluyen `restaurantId` para garantizar aislamiento multi-tenant:

```typescript
where: {
  id: orderId,
  restaurantId, // SIEMPRE presente
  // ... otras condiciones
}
```

## Recalculo Automático de Order Status

En `updateItemStatus()`, el status de la orden se recalcula automáticamente dentro de la transacción:

### Regla 1: CONFIRMED -> IN_PROGRESS
- **Condición:** Item cambia a IN_PROGRESS y order.status === CONFIRMED
- **Acción:** Actualizar order.status a IN_PROGRESS (con updateMany condicionado)
- **Evento:** Emitir `order.status.changed` si count === 1

### Regla 2: IN_PROGRESS -> READY
- **Condición:** Item cambia a READY, order.status === IN_PROGRESS, y TODOS los items no CANCELLED están READY
- **Acción:** Actualizar order.status a READY (con updateMany condicionado)
- **Evento:** Emitir `order.status.changed` si count === 1

## Testing de Concurrencia

Para probar race conditions:

1. **Doble confirm:**
   ```bash
   # Terminal 1
   curl -X POST /api/v1/orders/$ORDER_ID/confirm -H "Authorization: Bearer $TOKEN1"
   
   # Terminal 2 (simultáneo)
   curl -X POST /api/v1/orders/$ORDER_ID/confirm -H "Authorization: Bearer $TOKEN2"
   ```
   **Resultado esperado:** Uno exitoso (200), otro 409 Conflict

2. **Cerrar mientras items cambian:**
   ```bash
   # Terminal 1
   curl -X POST /api/v1/orders/$ORDER_ID/items/$ITEM_ID/status \
     -H "Authorization: Bearer $KITCHEN_TOKEN" \
     -d '{"status":"READY"}'
   
   # Terminal 2 (simultáneo)
   curl -X POST /api/v1/orders/$ORDER_ID/close \
     -H "Authorization: Bearer $CASHIER_TOKEN"
   ```
   **Resultado esperado:** El advisory lock serializa las operaciones

3. **Actualizar item concurrentemente:**
   ```bash
   # Terminal 1
   curl -X PATCH /api/v1/orders/$ORDER_ID/items/$ITEM_ID \
     -H "Authorization: Bearer $TOKEN1" \
     -d '{"qty":2}'
   
   # Terminal 2 (simultáneo)
   curl -X PATCH /api/v1/orders/$ORDER_ID/items/$ITEM_ID \
     -H "Authorization: Bearer $TOKEN2" \
     -d '{"qty":3}'
   ```
   **Resultado esperado:** Uno exitoso, otro 409 Conflict

## Notas Técnicas

- **Isolation Level:** Prisma usa el isolation level por defecto de PostgreSQL (READ COMMITTED). Los advisory locks garantizan serialización efectiva.
- **Performance:** Los advisory locks son ligeros y no bloquean otras órdenes.
- **Deadlocks:** Los advisory locks se liberan automáticamente al finalizar la transacción, evitando deadlocks.
- **Eventos WS:** Se emiten después de commit para garantizar que solo se emiten eventos de operaciones exitosas.

## Verificación

- ✅ Todas las operaciones críticas en transacciones
- ✅ Advisory locks en todas las operaciones críticas
- ✅ Updates atómicos con condiciones
- ✅ Verificación de count para detectar modificaciones concurrentes
- ✅ Eventos WS solo después de éxito
- ✅ Multi-tenancy mantenido (restaurantId en todos los where)
- ✅ Sin errores de linter
- ✅ pnpm build pasa
