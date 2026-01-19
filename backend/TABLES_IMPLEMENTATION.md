# Tables & TableSessions Implementation

## 📋 Resumen

Se han implementado los módulos `Tables` y `TableSessions` para gestionar mesas y sesiones de mesas en el sistema multi-tenant.

## 📁 Archivos Creados/Modificados

### Modificados:
1. `backend/prisma/schema.prisma` - Agregados modelos `Table` y `TableSession` con enums
2. `backend/src/app.module.ts` - Agregados `TablesModule` y `TableSessionsModule`

### Creados - Módulo Tables:
3. `backend/src/modules/tables/dto/create-table.dto.ts`
4. `backend/src/modules/tables/dto/table-response.dto.ts`
5. `backend/src/modules/tables/tables.service.ts`
6. `backend/src/modules/tables/tables.controller.ts`
7. `backend/src/modules/tables/tables.module.ts`

### Creados - Módulo TableSessions:
8. `backend/src/modules/table-sessions/dto/open-session.dto.ts`
9. `backend/src/modules/table-sessions/dto/request-checkout.dto.ts`
10. `backend/src/modules/table-sessions/dto/close-session.dto.ts`
11. `backend/src/modules/table-sessions/dto/session-response.dto.ts`
12. `backend/src/modules/table-sessions/table-sessions.service.ts`
13. `backend/src/modules/table-sessions/table-sessions.controller.ts`
14. `backend/src/modules/table-sessions/table-sessions.module.ts`

## 🗄️ Modelos de Base de Datos

### Table
- `id` (uuid)
- `restaurantId` (uuid, FK)
- `number` (int, único por restaurant)
- `area` (string, nullable)
- `status`: AVAILABLE | OCCUPIED | CHECKOUT
- `createdAt`, `updatedAt`

### TableSession
- `id` (uuid)
- `restaurantId` (uuid, FK)
- `tableId` (uuid, FK)
- `openedByUserId` (uuid, FK)
- `status`: OPEN | CHECKOUT | CLOSED
- `openedAt` (DateTime)
- `closedAt` (DateTime, nullable)
- `createdAt`, `updatedAt`

## 🚀 Comandos de Migración

```bash
# 1. Generar Prisma Client
cd backend
pnpm prisma:generate

# 2. Crear y aplicar migración
pnpm prisma:migrate dev --name add_tables

# 3. Verificar compilación
pnpm build

# 4. Iniciar servidor (si no está corriendo)
pnpm dev
```

## 📡 Endpoints Implementados

### Tables

#### GET /api/v1/tables
Obtiene todas las mesas del restaurante.

**Roles:** WAITER, CASHIER, ADMIN

**Headers:**
```bash
Authorization: Bearer <JWT_TOKEN>
```

**Ejemplo:**
```bash
curl -X GET http://localhost:3000/api/v1/tables \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "number": 1,
    "area": "Sala Principal",
    "status": "AVAILABLE",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /api/v1/tables
Crea una nueva mesa.

**Roles:** ADMIN

**Body:**
```json
{
  "number": 1,
  "area": "Sala Principal"
}
```

**Ejemplo:**
```bash
curl -X POST http://localhost:3000/api/v1/tables \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "number": 1,
    "area": "Sala Principal"
  }'
```

### Table Sessions

#### POST /api/v1/table-sessions/open
Abre una nueva sesión de mesa.

**Roles:** WAITER, CASHIER

**Body:**
```json
{
  "tableId": "uuid"
}
```

**Ejemplo:**
```bash
curl -X POST http://localhost:3000/api/v1/table-sessions/open \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tableId": "table-uuid-here"
  }'
```

**Respuesta:**
```json
{
  "id": "session-uuid",
  "tableId": "table-uuid",
  "table": {
    "id": "table-uuid",
    "number": 1,
    "area": "Sala Principal",
    "status": "OCCUPIED"
  },
  "openedByUserId": "user-uuid",
  "status": "OPEN",
  "openedAt": "2024-01-01T00:00:00.000Z",
  "closedAt": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Errores:**
- `404`: Mesa no encontrada
- `409`: Mesa ya tiene una sesión abierta

#### POST /api/v1/table-sessions/request-checkout
Solicita checkout de una sesión (cambia a estado CHECKOUT).

**Roles:** WAITER, CASHIER

**Body:**
```json
{
  "sessionId": "uuid"
}
```

**Ejemplo:**
```bash
curl -X POST http://localhost:3000/api/v1/table-sessions/request-checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-uuid-here"
  }'
```

**Errores:**
- `404`: Sesión no encontrada
- `409`: Sesión no está en estado OPEN

#### POST /api/v1/table-sessions/close
Cierra una sesión (solo CASHIER).

**Roles:** CASHIER

**Body:**
```json
{
  "sessionId": "uuid"
}
```

**Ejemplo:**
```bash
curl -X POST http://localhost:3000/api/v1/table-sessions/close \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-uuid-here"
  }'
```

**Respuesta:**
```json
{
  "id": "session-uuid",
  "tableId": "table-uuid",
  "table": {
    "id": "table-uuid",
    "number": 1,
    "area": "Sala Principal",
    "status": "AVAILABLE"
  },
  "openedByUserId": "user-uuid",
  "status": "CLOSED",
  "openedAt": "2024-01-01T00:00:00.000Z",
  "closedAt": "2024-01-01T01:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T01:00:00.000Z"
}
```

**Errores:**
- `404`: Sesión no encontrada
- `409`: Sesión ya está cerrada

#### GET /api/v1/table-sessions/active
Obtiene todas las sesiones activas (OPEN o CHECKOUT).

**Roles:** CASHIER, ADMIN

**Ejemplo:**
```bash
curl -X GET http://localhost:3000/api/v1/table-sessions/active \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Respuesta:**
```json
[
  {
    "id": "session-uuid",
    "tableId": "table-uuid",
    "table": {
      "id": "table-uuid",
      "number": 1,
      "area": "Sala Principal",
      "status": "OCCUPIED"
    },
    "openedByUserId": "user-uuid",
    "status": "OPEN",
    "openedAt": "2024-01-01T00:00:00.000Z",
    "closedAt": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

## 🔒 Seguridad y Multi-tenancy

- Todos los endpoints requieren autenticación JWT (`JwtAuthGuard`)
- Todos los endpoints filtran por `restaurantId` del JWT (`TenantGuard`)
- Los roles se validan con `RolesGuard` y el decorator `@Roles()`
- El `restaurantId` se obtiene automáticamente del JWT, nunca del body

## 🔄 Flujo de Estados

### Table Status:
- `AVAILABLE` → `OCCUPIED` (al abrir sesión)
- `OCCUPIED` → `CHECKOUT` (al solicitar checkout)
- `CHECKOUT` → `AVAILABLE` (al cerrar sesión)

### TableSession Status:
- `OPEN` → `CHECKOUT` (al solicitar checkout)
- `CHECKOUT` → `CLOSED` (al cerrar sesión)

## ✅ Reglas de Negocio Implementadas

1. ✅ Una mesa solo puede tener 1 sesión OPEN a la vez
2. ✅ Al abrir sesión, la mesa pasa a OCCUPIED si estaba AVAILABLE
3. ✅ Al solicitar checkout, sesión y mesa pasan a CHECKOUT
4. ✅ Al cerrar sesión, mesa pasa a AVAILABLE y sesión a CLOSED
5. ✅ Todo filtrado por restaurantId del JWT
6. ✅ Validación de existencia y pertenencia al restaurante
7. ✅ Transacciones Prisma para operaciones atómicas

## 🧪 Flujo de Prueba Completo

```bash
# 1. Login como ADMIN
TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@restaurante.com","password":"password123"}' \
  | jq -r '.accessToken')

# 2. Crear mesa
TABLE_ID=$(curl -X POST http://localhost:3000/api/v1/tables \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"number": 1, "area": "Sala Principal"}' \
  | jq -r '.id')

# 3. Login como WAITER
WAITER_TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"waiter@restaurante.com","password":"password123"}' \
  | jq -r '.accessToken')

# 4. Abrir sesión
SESSION_ID=$(curl -X POST http://localhost:3000/api/v1/table-sessions/open \
  -H "Authorization: Bearer $WAITER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tableId\": \"$TABLE_ID\"}" \
  | jq -r '.id')

# 5. Solicitar checkout
curl -X POST http://localhost:3000/api/v1/table-sessions/request-checkout \
  -H "Authorization: Bearer $WAITER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\"}"

# 6. Login como CASHIER
CASHIER_TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cashier@restaurante.com","password":"password123"}' \
  | jq -r '.accessToken')

# 7. Ver sesiones activas
curl -X GET http://localhost:3000/api/v1/table-sessions/active \
  -H "Authorization: Bearer $CASHIER_TOKEN"

# 8. Cerrar sesión
curl -X POST http://localhost:3000/api/v1/table-sessions/close \
  -H "Authorization: Bearer $CASHIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\"}"
```

## ✅ Verificación

- ✅ No hay errores de linter
- ✅ Todos los endpoints implementados
- ✅ Guards y decorators correctamente aplicados
- ✅ Multi-tenancy asegurado
- ✅ Transacciones Prisma para operaciones críticas
- ✅ Validación de DTOs con class-validator
- ✅ Manejo de errores apropiado (404, 409)
