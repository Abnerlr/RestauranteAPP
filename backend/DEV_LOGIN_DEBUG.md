# Dev Login Endpoint - Debug y Verificación

## Diagnóstico Implementado

Se ha agregado observabilidad completa para diagnosticar problemas con el endpoint dev-login.

## Cambios Realizados

### 1. Logging en `main.ts`

**Archivo:** `backend/src/main.ts`

- ✅ Log de URL del servidor
- ✅ Log de NODE_ENV
- ✅ Log de global prefix (confirmado: none, rutas usan path completo)
- ✅ Listado de rutas que contienen "/auth" en development
- ✅ Comando curl listo para copiar

### 2. Logging en `auth.controller.ts`

**Archivo:** `backend/src/modules/auth/auth.controller.ts`

- ✅ Log cuando se recibe request en dev-login
- ✅ Log cuando se genera token exitosamente

## Verificación

### Paso 1: Iniciar Backend

```bash
cd backend
pnpm dev
```

**Salida esperada:**
```
============================================================
[BOOT] Application started
[BOOT] URL: http://[::]:3000
[BOOT] NODE_ENV: development
[BOOT] Global prefix: none (routes use full path in @Controller)
============================================================

[ROUTES] Registered routes containing "/auth":
------------------------------------------------------------
  POST     /api/v1/auth/login
  POST     /api/v1/auth/dev-login
------------------------------------------------------------

[DEV] Dev login endpoint should be available at:
      POST http://[::]:3000/api/v1/auth/dev-login

[DEV] Test with:
      curl -X POST http://[::]:3000/api/v1/auth/dev-login \
        -H "Content-Type: application/json" \
        -d '{"role":"KITCHEN","restaurantId":"rest_1"}'
```

### Paso 2: Probar Endpoint

**Comando curl (Windows PowerShell):**
```powershell
curl.exe -X POST http://localhost:3000/api/v1/auth/dev-login `
  -H "Content-Type: application/json" `
  -d '{\"role\":\"KITCHEN\",\"restaurantId\":\"rest_1\"}'
```

**Comando curl (Linux/Mac):**
```bash
curl -X POST http://localhost:3000/api/v1/auth/dev-login \
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

### Paso 3: Verificar Logs en Consola

Si el endpoint funciona, deberías ver en la consola del backend:
```
[DEV-LOGIN] Request received: {
  role: 'KITCHEN',
  restaurantId: 'rest_1',
  userId: 'auto-generated'
}
[DEV-LOGIN] Token generated successfully
```

## Troubleshooting

### Si aún devuelve 404

1. **Verificar que el servidor está corriendo:**
   - Revisar los logs de arranque
   - Verificar que muestra las rutas `/auth`

2. **Verificar puerto:**
   - El puerto puede ser diferente a 3000
   - Revisar la URL en los logs: `[BOOT] URL: ...`

3. **Verificar NODE_ENV:**
   - Debe ser `development`
   - Si es `production`, el endpoint retorna 404

4. **Verificar que AuthModule está registrado:**
   - Revisar `backend/src/app.module.ts`
   - Debe incluir `AuthModule` en imports

5. **Reiniciar servidor:**
   - Si usas `pnpm dev`, debería recargar automáticamente
   - Si no, detener y volver a iniciar

### Si el endpoint no aparece en las rutas listadas

1. **Verificar sintaxis del controller:**
   - `@Controller('api/v1/auth')` debe estar presente
   - `@Post('dev-login')` debe estar presente

2. **Verificar que el módulo está importado:**
   - `AuthModule` debe estar en `AppModule.imports`

3. **Verificar errores de compilación:**
   - Revisar la consola por errores TypeScript
   - Verificar que no hay errores de importación

## Estructura de Rutas Confirmada

- **No hay global prefix** - cada controller define su path completo
- **AuthController** usa `@Controller('api/v1/auth')`
- **Ruta final:** `POST /api/v1/auth/dev-login`

## Comandos de Prueba Rápida

### Windows PowerShell
```powershell
# Obtener token
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/dev-login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"role":"KITCHEN","restaurantId":"rest_1"}'

# Mostrar token
$response.access_token
```

### Linux/Mac/Bash
```bash
# Obtener token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"role":"KITCHEN","restaurantId":"rest_1"}' \
  | jq -r '.access_token')

# Mostrar token
echo $TOKEN
```

## Confirmación Final

Una vez que el endpoint funcione:

1. ✅ El curl retorna 200 con `access_token`
2. ✅ Los logs muestran `[DEV-LOGIN] Request received`
3. ✅ El token funciona en REST API (probar con `/api/v1/orders/active`)
4. ✅ El token funciona en WebSocket (conectar desde frontend)
