# Fix Definitivo del Gating de Dev-Login

## Problema

El endpoint `dev-login` estaba bloqueando incorrectamente porque:
- Dependía de `NODE_ENV` que puede ser `undefined` en Windows
- La validación era frágil y inconsistente
- `__health` mostraba `nodeEnvNormalized:'development'` pero `isDevelopment:false`

## Solución Implementada

### Cambio de Estrategia

Se cambió de depender de `NODE_ENV` a usar una variable de entorno explícita `DEV_LOGIN_ENABLED`:

- ✅ **Más explícito**: Requiere configuración intencional
- ✅ **Más robusto**: No depende de `NODE_ENV` que puede ser `undefined`
- ✅ **Más seguro**: Por defecto está deshabilitado (opt-in)

### Archivos Modificados

#### 1. `backend/src/config/env.ts`
- ✅ Agregada función `isDevLoginEnabled(value?: string)`
- ✅ Acepta: `'true'`, `'1'`, `'yes'`, `'on'` (case-insensitive)

#### 2. `backend/src/modules/auth/auth.controller.ts`
- ✅ Reemplazado check de `NODE_ENV` por `DEV_LOGIN_ENABLED`
- ✅ Logging detallado cuando se bloquea:
  - `processEnvDEV_LOGIN_ENABLED`
  - `configDEV_LOGIN_ENABLED`
  - `enabled` (boolean)

#### 3. `backend/src/modules/auth/auth.service.ts`
- ✅ Reemplazado check de `NODE_ENV` por `DEV_LOGIN_ENABLED`

#### 4. `backend/src/app.controller.ts`
- ✅ `__health` ahora reporta:
  - `devLoginEnabled`: boolean
  - `nodeEnvRaw`: `process.env.NODE_ENV`
  - `configNodeEnv`: `configService.get('NODE_ENV')`

#### 5. `backend/README.md`
- ✅ Actualizado con información sobre `DEV_LOGIN_ENABLED`
- ✅ Comandos de ejemplo actualizados

## Configuración

### En `backend/.env`:

```env
# Development Features
# Set to 'true', '1', 'yes', or 'on' (case-insensitive) to enable dev-login endpoint
# ⚠️ NEVER set this to true in production
DEV_LOGIN_ENABLED=true
```

**Valores aceptados (case-insensitive):**
- ✅ `true`
- ✅ `1`
- ✅ `yes`
- ✅ `on`
- ❌ Cualquier otro valor o `undefined` → deshabilitado

## Verificación

### 1. Configurar `.env`

Agrega a `backend/.env`:
```env
DEV_LOGIN_ENABLED=true
```

### 2. Reiniciar el Backend

```bash
cd backend
pnpm dev
```

### 3. Verificar Health Endpoint

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/v1/__health" -Method GET
```

**Esperado:**
```json
{
  "ok": true,
  "name": "restaurante-app-backend",
  "port": 3001,
  "nodeEnv": "development",
  "nodeEnvRaw": "development",
  "configNodeEnv": "development",
  "nodeEnvNormalized": "development",
  "isDevelopment": true,
  "devLoginEnabled": true,
  "globalPrefix": "api/v1",
  "routesDebugUrl": "http://localhost:3001/api/v1/__routes"
}
```

### 4. Verificar Dev-Login Endpoint

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

### 5. Verificar Logs en Consola

Al hacer la petición a `dev-login`, deberías ver:
```
[DEV-LOGIN] Handler hit { role: 'KITCHEN', restaurantId: 'rest_1', userId: 'auto-generated' }
[DEV-LOGIN] Token generated successfully
```

Si está bloqueado (no debería si `DEV_LOGIN_ENABLED=true`), verías:
```
[DEV-LOGIN] Handler hit { role: 'KITCHEN', restaurantId: 'rest_1', userId: 'auto-generated' }
[DEV-LOGIN] Blocked: DEV_LOGIN_ENABLED is false {
  processEnvDEV_LOGIN_ENABLED: undefined,
  configDEV_LOGIN_ENABLED: undefined,
  enabled: false
}
```

## Troubleshooting

### Si dev-login sigue bloqueando:

1. **Verifica `backend/.env`:**
   ```env
   DEV_LOGIN_ENABLED=true
   ```
   O cualquier variante: `1`, `yes`, `on`, `TRUE`, `YES`, etc.

2. **Verifica los logs** cuando haces la petición:
   - Deberías ver los valores de `processEnvDEV_LOGIN_ENABLED` y `configDEV_LOGIN_ENABLED`
   - Si ambos son `undefined` o no son valores válidos, se bloqueará

3. **Reinicia el backend** después de cambiar `.env`

4. **Verifica que no haya espacios** en el valor:
   ```env
   # ❌ Mal
   DEV_LOGIN_ENABLED= true
   
   # ✅ Bien
   DEV_LOGIN_ENABLED=true
   ```

5. **Verifica `__health` endpoint:**
   - Debe mostrar `devLoginEnabled: true` si está configurado correctamente

### Si `__health` muestra `devLoginEnabled: false`:

- Verifica `backend/.env` tiene `DEV_LOGIN_ENABLED=true` (o variante válida)
- Reinicia el backend
- Verifica que no haya otro proceso leyendo un `.env` diferente

## Seguridad

- ⚠️ **NUNCA** configures `DEV_LOGIN_ENABLED=true` en producción
- Por defecto, el endpoint está **deshabilitado** (opt-in)
- El endpoint retorna `404` si `DEV_LOGIN_ENABLED` no está habilitado
- Los tokens generados son válidos y funcionan con la misma autenticación que tokens de producción

## Confirmación Final

✅ Gating basado en `DEV_LOGIN_ENABLED` (no `NODE_ENV`)  
✅ `auth.controller.ts` usa `DEV_LOGIN_ENABLED` con logging detallado  
✅ `auth.service.ts` usa `DEV_LOGIN_ENABLED`  
✅ `__health` reporta `devLoginEnabled`, `nodeEnvRaw`, y `configNodeEnv`  
✅ Documentación actualizada en `README.md`  
✅ Funciona en Windows incluso si `NODE_ENV` es `undefined`
