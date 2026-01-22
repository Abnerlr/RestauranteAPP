# Fix de Consistencia de NODE_ENV

## Problema

Había inconsistencia en cómo se validaba `NODE_ENV` en diferentes partes del backend:

- `POST /api/v1/auth/dev-login` bloqueaba con `[DEV-LOGIN] Blocked: NODE_ENV is not development`
- Pero `GET /api/v1/__health` devolvía `nodeEnv: development`
- La validación era case-sensitive y no tenía fallbacks consistentes

## Solución Implementada

### 1. Helper Común (`backend/src/config/env.ts`)

Se creó un módulo de utilidades para validación de entorno:

- `isDevelopmentEnv(nodeEnv?)`: Valida si el entorno es desarrollo (case-insensitive)
  - Acepta: `'development'`, `'dev'`, `'local'` (en cualquier caso)
- `getNormalizedNodeEnv(nodeEnv?)`: Normaliza NODE_ENV a lowercase
- `getNodeEnvInfo(nodeEnv?)`: Retorna información completa para logging

### 2. Archivos Actualizados

#### `backend/src/modules/auth/auth.controller.ts`
- ✅ Usa `isDevelopmentEnv()` y `getNodeEnvInfo()`
- ✅ Logging detallado cuando se bloquea:
  - `process.env.NODE_ENV`
  - `configService.get('NODE_ENV')`
  - Valor normalizado
  - `isDevelopment` boolean

#### `backend/src/modules/auth/auth.service.ts`
- ✅ Usa `isDevelopmentEnv()` con fallback a `process.env.NODE_ENV`

#### `backend/src/app.controller.ts`
- ✅ `__health`: Usa `getNodeEnvInfo()` y reporta:
  - `nodeEnv`: Normalized
  - `nodeEnvRaw`: Raw value
  - `nodeEnvNormalized`: Normalized (duplicado para claridad)
  - `isDevelopment`: Boolean
- ✅ `__routes`: Usa `getNodeEnvInfo()` con logging detallado

## Verificación

### 1. Reiniciar el Backend

```bash
cd backend
pnpm dev
```

### 2. Verificar Health Endpoint

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/v1/__health" -Method GET
```

**Esperado (200 OK):**
```json
{
  "ok": true,
  "name": "restaurante-app-backend",
  "port": 3001,
  "nodeEnv": "development",
  "nodeEnvRaw": "development",
  "nodeEnvNormalized": "development",
  "isDevelopment": true,
  "globalPrefix": "api/v1",
  "routesDebugUrl": "http://localhost:3001/api/v1/__routes"
}
```

### 3. Verificar Dev-Login Endpoint

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/dev-login" -Method POST -ContentType "application/json" -Body '{"role":"KITCHEN","restaurantId":"rest_1"}'
```

**Esperado (200 OK):**
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

### 4. Verificar Logs en Consola

Al hacer la petición a `dev-login`, deberías ver en la consola del backend:
```
[DEV-LOGIN] Handler hit { role: 'KITCHEN', restaurantId: 'rest_1', userId: 'auto-generated' }
[DEV-LOGIN] Token generated successfully
```

Si está bloqueado (no debería en development), verías:
```
[DEV-LOGIN] Handler hit { role: 'KITCHEN', restaurantId: 'rest_1', userId: 'auto-generated' }
[DEV-LOGIN] Blocked: NODE_ENV is not development {
  processEnvNODE_ENV: 'production',
  configNODE_ENV: 'production',
  normalized: 'production',
  isDevelopment: false
}
```

## Casos de Uso Soportados

El helper `isDevelopmentEnv()` acepta los siguientes valores (case-insensitive):

- ✅ `'development'` → `true`
- ✅ `'dev'` → `true`
- ✅ `'local'` → `true`
- ✅ `'Development'` → `true`
- ✅ `'DEV'` → `true`
- ✅ `'LOCAL'` → `true`
- ❌ `'production'` → `false`
- ❌ `'staging'` → `false`
- ❌ `'test'` → `false`
- ❌ `undefined` → `false` (pero `__health` usa 'development' como default)

## Orden de Precedencia

En todos los lugares donde se valida NODE_ENV, se usa este orden:

1. `configService.get<string>('NODE_ENV')` (si está disponible)
2. `process.env.NODE_ENV` (fallback)
3. `'development'` (solo en `__health` como default para reporte)

## Troubleshooting

### Si dev-login sigue bloqueando:

1. **Verifica `backend/.env`:**
   ```env
   NODE_ENV=development
   ```
   O cualquier variante: `dev`, `local`, `Development`, etc.

2. **Verifica los logs** cuando haces la petición:
   - Deberías ver los valores de `processEnvNODE_ENV` y `configNODE_ENV`
   - Si ambos son `undefined` o no son valores de desarrollo, se bloqueará

3. **Reinicia el backend** después de cambiar `.env`

4. **Verifica que no haya espacios** en el valor:
   ```env
   # ❌ Mal
   NODE_ENV= development
   
   # ✅ Bien
   NODE_ENV=development
   ```

### Si `__health` muestra `isDevelopment: false`:

- Verifica `backend/.env` tiene `NODE_ENV=development` (o variante)
- Reinicia el backend
- Verifica que no haya otro proceso leyendo un `.env` diferente

## Confirmación Final

✅ Helper común creado en `backend/src/config/env.ts`  
✅ `auth.controller.ts` usa helper con logging detallado  
✅ `auth.service.ts` usa helper  
✅ `app.controller.ts` (`__health` y `__routes`) usa helper  
✅ Validación case-insensitive  
✅ Logging detallado cuando se bloquea  
✅ `__health` reporta información completa de NODE_ENV
