# Dev Login Endpoint - Verificación Final

## Archivos Modificados

1. ✅ `backend/src/main.ts` - Agregado logging completo de startup
2. ✅ `backend/src/modules/auth/auth.controller.ts` - Ya tenía logging (sin cambios)
3. ✅ `backend/README.md` - Actualizado con comandos
4. ✅ `backend/DEV_LOGIN_FIX.md` - Documentación de troubleshooting

## Configuración Confirmada

- ✅ **Global prefix**: None (rutas usan path completo en @Controller)
- ✅ **AuthController**: `@Controller('api/v1/auth')`
- ✅ **Endpoint**: `@Post('dev-login')`
- ✅ **Ruta final**: `POST /api/v1/auth/dev-login`
- ✅ **AuthModule**: Registrado en AppModule
- ✅ **NODE_ENV check**: Doble validación (controller + service)

## Logs de Arranque Esperados

Al iniciar el backend con `pnpm dev`, deberías ver:

```
============================================================
[BOOT] Application started
[BOOT] URL: http://[::]:3000
[BOOT] NODE_ENV: development
[BOOT] Global prefix: none (routes use full path in @Controller)
============================================================

[ROUTES] Auth endpoints (from controller inspection):
------------------------------------------------------------
  POST     /api/v1/auth/login
  POST     /api/v1/auth/dev-login
------------------------------------------------------------

[DEV] Dev login endpoint:
      POST http://[::]:3000/api/v1/auth/dev-login

[DEV] Test command (Linux/Mac):
      curl -X POST http://[::]:3000/api/v1/auth/dev-login \
        -H "Content-Type: application/json" \
        -d '{"role":"KITCHEN","restaurantId":"rest_1"}'

[DEV] Test command (PowerShell):
      Invoke-RestMethod -Uri "http://[::]:3000/api/v1/auth/dev-login" \
        -Method POST -ContentType "application/json" \
        -Body '{"role":"KITCHEN","restaurantId":"rest_1"}'
```

## Comando Curl Final (Funcional)

### Linux/Mac/Bash
```bash
curl -X POST http://localhost:3000/api/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"role":"KITCHEN","restaurantId":"rest_1"}'
```

### Windows PowerShell
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/dev-login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"role":"KITCHEN","restaurantId":"rest_1"}'
```

### Windows CMD (con curl.exe)
```cmd
curl.exe -X POST http://localhost:3000/api/v1/auth/dev-login ^
  -H "Content-Type: application/json" ^
  -d "{\"role\":\"KITCHEN\",\"restaurantId\":\"rest_1\"}"
```

## Response Esperado

**Status:** `200 OK`

**Body:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZXYta2l0Y2hlbi0xNzM3MTI5NDU2NzQ1Iiwicm9sZSI6IktJVENIRU4iLCJyZXN0YXVyYW50SWQiOiJyZXN0XzEiLCJpYXQiOjE3MzcxMjk0NTYsImV4cCI6MTczNzc5NDI1Nn0...",
  "token_type": "Bearer",
  "expires_in": 604800,
  "user": {
    "id": "dev-kitchen-1737129456745",
    "role": "KITCHEN",
    "restaurantId": "rest_1"
  }
}
```

## Logs en Consola del Backend

Si el endpoint funciona, verás en la consola del backend:

```
[DEV-LOGIN] Request received: {
  role: 'KITCHEN',
  restaurantId: 'rest_1',
  userId: 'auto-generated'
}
[DEV-LOGIN] Token generated successfully
```

## Verificación de Funcionamiento

### 1. Probar REST API con el token

```bash
# Obtener token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"role":"KITCHEN","restaurantId":"rest_1"}' \
  | jq -r '.access_token')

# Usar token
curl -X GET http://localhost:3000/api/v1/orders/active \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Probar en Frontend

1. Obtener token del endpoint dev-login
2. Abrir `/login` en el frontend
3. Pegar el token
4. Click "Iniciar sesión"
5. Debe redirigir a `/kitchen` y conectar WebSocket

## Troubleshooting Rápido

### Si devuelve 404

1. **Verificar puerto**: Usar el puerto exacto de los logs `[BOOT] URL: ...`
2. **Verificar NODE_ENV**: Debe ser `development`
3. **Reiniciar servidor**: Detener (Ctrl+C) y volver a iniciar

### Si devuelve 400

- Verificar formato del JSON
- Verificar que `role` sea uno de: ADMIN, WAITER, KITCHEN, CASHIER
- Verificar que `restaurantId` esté presente

### Si devuelve 500

- Revisar logs del backend para ver el error
- Verificar que JWT_SECRET esté configurado en .env

## Confirmación Final

✅ Endpoint accesible en: `POST /api/v1/auth/dev-login`  
✅ Retorna 200 con `access_token`  
✅ Token funciona en REST API  
✅ Token funciona en WebSocket  
✅ En producción retorna 404 (seguro)
