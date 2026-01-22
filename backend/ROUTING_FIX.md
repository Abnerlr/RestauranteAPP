# Fix de Routing - Global Prefix Estandarizado

## Problema Resuelto

Los controllers tenían hardcodeado `'api/v1/...'` en el decorador `@Controller`, lo que causaba desalineamiento con el routing de NestJS y posibles problemas de duplicación de prefix.

## Solución Implementada

### Cambios Realizados

1. **Global Prefix en `main.ts`**
   - Agregado `app.setGlobalPrefix('api/v1')`
   - Log explícito: `[BOOT] Global prefix: api/v1`

2. **Controllers Actualizados** (removido `api/v1/` del path)
   - `AuthController`: `@Controller('auth')` → ruta final: `/api/v1/auth`
   - `OrdersController`: `@Controller('orders')` → ruta final: `/api/v1/orders`
   - `RestaurantsController`: `@Controller('restaurants')` → ruta final: `/api/v1/restaurants`
   - `TablesController`: `@Controller('tables')` → ruta final: `/api/v1/tables`
   - `TableSessionsController`: `@Controller('table-sessions')` → ruta final: `/api/v1/table-sessions`

3. **Endpoint de Diagnóstico** (`/api/v1/__routes`)
   - Solo disponible en development
   - Lista todas las rutas registradas
   - Útil para debugging de routing

4. **Logging Mejorado**
   - Handler `dev-login` ahora loggea cuando es llamado
   - Logs más detallados para debugging

5. **Test E2E**
   - Test básico para validar que el endpoint funciona
   - Valida response structure

## Archivos Modificados

1. ✅ `backend/src/main.ts` - Agregado `setGlobalPrefix('api/v1')`
2. ✅ `backend/src/modules/auth/auth.controller.ts` - Cambiado a `@Controller('auth')`
3. ✅ `backend/src/modules/orders/orders.controller.ts` - Cambiado a `@Controller('orders')`
4. ✅ `backend/src/modules/restaurants/restaurants.controller.ts` - Cambiado a `@Controller('restaurants')`
5. ✅ `backend/src/modules/tables/tables.controller.ts` - Cambiado a `@Controller('tables')`
6. ✅ `backend/src/modules/table-sessions/table-sessions.controller.ts` - Cambiado a `@Controller('table-sessions')`
7. ✅ `backend/src/modules/dev/dev.controller.ts` - Nuevo endpoint de diagnóstico
8. ✅ `backend/src/modules/dev/dev.module.ts` - Nuevo módulo de desarrollo
9. ✅ `backend/src/app.module.ts` - Agregado `DevModule`
10. ✅ `backend/test/auth-dev-login.e2e-spec.ts` - Test e2e
11. ✅ `backend/package.json` - Agregado `supertest` y `@nestjs/testing`
12. ✅ `backend/README.md` - Documentación actualizada

## Logs de Arranque Esperados

```
============================================================
[BOOT] Application started
[BOOT] Listening on: 0.0.0.0:3001 (IPv4)
[BOOT] NODE_ENV: development
[BOOT] Global prefix: api/v1

[BOOT] Accessible at:
  - http://localhost:3001
  - http://127.0.0.1:3001
============================================================

[ROUTES] Auth endpoints (from controller inspection):
------------------------------------------------------------
  POST     /api/v1/auth/login
  POST     /api/v1/auth/dev-login
------------------------------------------------------------

[DEV] Dev login endpoint:
      POST http://localhost:3001/api/v1/auth/dev-login

[DEV] Routes debug endpoint:
      GET http://localhost:3001/api/v1/__routes
```

## Verificación

### 1. Probar Dev Login

```bash
curl -X POST http://localhost:3001/api/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"role":"KITCHEN","restaurantId":"rest_1"}'
```

**Response esperado (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 604800,
  "user": {
    "id": "dev-kitchen-1234567890",
    "role": "KITCHEN",
    "restaurantId": "rest_1"
  }
}
```

**Logs en consola del backend:**
```
[DEV-LOGIN] Handler hit {
  role: 'KITCHEN',
  restaurantId: 'rest_1',
  userId: 'auto-generated'
}
[DEV-LOGIN] Token generated successfully
```

### 2. Probar Routes Debug

```bash
curl http://localhost:3001/api/v1/__routes
```

**Response esperado:**
```json
{
  "routes": [
    {
      "method": "POST",
      "path": "/api/v1/auth/dev-login"
    },
    {
      "method": "POST",
      "path": "/api/v1/auth/login"
    },
    {
      "method": "GET",
      "path": "/api/v1/orders/active"
    }
  ]
}
```

### 3. Ejecutar Test E2E

```bash
cd backend
pnpm test auth-dev-login.e2e-spec.ts
```

## Confirmación Final

✅ **Global prefix estandarizado**: `api/v1` en `main.ts`  
✅ **Controllers sin hardcode**: Solo path base en `@Controller`  
✅ **Endpoint dev-login funciona**: Retorna 200 con `access_token`  
✅ **Handler loggea**: Se ve `[DEV-LOGIN] Handler hit` en consola  
✅ **Routes debug disponible**: `GET /api/v1/__routes` lista todas las rutas  
✅ **Test e2e creado**: Valida funcionamiento del endpoint

## Estructura de Rutas Final

Todas las rutas ahora siguen el patrón:
- `@Controller('auth')` + `setGlobalPrefix('api/v1')` = `/api/v1/auth/*`
- `@Controller('orders')` + `setGlobalPrefix('api/v1')` = `/api/v1/orders/*`
- etc.

Esto es el estándar de NestJS y evita problemas de routing.
