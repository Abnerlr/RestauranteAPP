# Orders Schema Changes

## Resumen

Se han agregado los modelos `Order` y `OrderItem` al schema de Prisma, junto con sus enums correspondientes y las relaciones necesarias en los modelos existentes.

## Cambios Realizados

### 1. Enums Agregados

```prisma
enum OrderStatus {
  DRAFT
  CONFIRMED
  IN_PROGRESS
  READY
  CANCELLED
  CLOSED
}

enum OrderItemStatus {
  PENDING
  IN_PROGRESS
  READY
  CANCELLED
}
```

### 2. Modelos Agregados

#### Order
- `id` (uuid)
- `restaurantId` (uuid, FK) - Multi-tenant
- `tableSessionId` (uuid, FK)
- `createdByUserId` (uuid, FK)
- `status` (OrderStatus, default: DRAFT)
- `notes` (string, nullable)
- `confirmedAt` (DateTime, nullable)
- `closedAt` (DateTime, nullable)
- `createdAt`, `updatedAt`
- Índices: `[restaurantId, tableSessionId]`, `[restaurantId, status]`

#### OrderItem
- `id` (uuid)
- `restaurantId` (uuid, FK) - Multi-tenant
- `orderId` (uuid, FK)
- `name` (string)
- `qty` (int)
- `unitPrice` (Decimal(10,2), nullable) - Para MVP sin catálogo
- `status` (OrderItemStatus, default: PENDING)
- `notes` (string, nullable)
- `createdAt`, `updatedAt`
- Índices: `[restaurantId, orderId]`, `[restaurantId, status]`

### 3. Relaciones Actualizadas

#### Restaurant
- Agregado: `orders Order[]`
- Agregado: `orderItems OrderItem[]`

#### User
- Agregado: `ordersCreated Order[]` (relación por `createdByUserId`)

#### TableSession
- Agregado: `orders Order[]`

## Schema Completo

El schema completo actualizado está en `backend/prisma/schema.prisma`.

## Validación

El schema ha sido validado exitosamente:
```bash
npx prisma validate
# ✅ The schema at prisma\schema.prisma is valid 🚀
```

## Migración

Para crear y aplicar la migración:

```bash
cd backend

# 1. Generar Prisma Client (si no hay problemas de permisos)
pnpm prisma:generate

# 2. Crear y aplicar migración
pnpm prisma:migrate dev --name add_orders
```

**Nota:** Si encuentras errores de permisos al generar el cliente (EPERM), cierra cualquier proceso que esté usando Prisma (como el servidor en desarrollo) y vuelve a intentar.

## Nombre de la Migración

La migración se creará con el nombre: `add_orders`

## Estructura de la Migración

La migración creará:
1. Los enums `OrderStatus` y `OrderItemStatus`
2. La tabla `orders` con:
   - Columnas según el modelo
   - Foreign keys a `restaurants`, `table_sessions`, y `users`
   - Índices compuestos para optimizar consultas multi-tenant
3. La tabla `order_items` con:
   - Columnas según el modelo
   - Foreign keys a `restaurants` y `orders`
   - Índices compuestos para optimizar consultas multi-tenant

## Características de Diseño

✅ **Multi-tenant**: Todos los modelos tienen `restaurantId`  
✅ **Índices optimizados**: Para consultas por `restaurantId` + otros campos  
✅ **Cascadas apropiadas**: `onDelete: Cascade` para relaciones de negocio, `onDelete: Restrict` para relaciones con usuarios  
✅ **MVP-friendly**: `unitPrice` es opcional para no requerir catálogo de productos aún  
✅ **Naming consistente**: Sigue el patrón del schema existente  

## Próximos Pasos

Una vez aplicada la migración:
1. El Prisma Client estará actualizado con los nuevos modelos
2. Se pueden crear servicios/controladores para Orders y OrderItems
3. Los índices permitirán consultas eficientes por restaurantId
