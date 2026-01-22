# Fix IPv4/IPv6 - Windows Compatibility

## Problema Resuelto

El servidor NestJS estaba escuchando en IPv6 (`[::1]`) por defecto, lo que causaba problemas en Windows cuando se intentaba acceder desde `localhost` o `127.0.0.1`.

## Solución Implementada

### Cambios en `backend/src/main.ts`

1. **Forzar binding IPv4:**
   ```typescript
   await app.listen(port, '0.0.0.0');
   ```
   - Escucha en todas las interfaces IPv4
   - Acepta conexiones desde `localhost`, `127.0.0.1` y la red local
   - Evita problemas con IPv6 en Windows

2. **Logs mejorados:**
   - Muestra explícitamente `http://localhost:${port}`
   - Muestra explícitamente `http://127.0.0.1:${port}`
   - Indica claramente que está usando IPv4
   - Comandos curl actualizados para usar URLs IPv4

## Logs de Arranque Esperados

```
============================================================
[BOOT] Application started
[BOOT] Listening on: 0.0.0.0:3000 (IPv4)
[BOOT] NODE_ENV: development
[BOOT] Global prefix: none (routes use full path in @Controller)

[BOOT] Accessible at:
  - http://localhost:3000
  - http://127.0.0.1:3000
============================================================

[ROUTES] Auth endpoints (from controller inspection):
------------------------------------------------------------
  POST     /api/v1/auth/login
  POST     /api/v1/auth/dev-login
------------------------------------------------------------

[DEV] Dev login endpoint:
      POST http://localhost:3000/api/v1/auth/dev-login

[DEV] Test command (Linux/Mac/Git Bash):
      curl -X POST http://localhost:3000/api/v1/auth/dev-login \
        -H "Content-Type: application/json" \
        -d '{"role":"KITCHEN","restaurantId":"rest_1"}'

[DEV] Test command (PowerShell):
      Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/dev-login" \
        -Method POST -ContentType "application/json" \
        -Body '{"role":"KITCHEN","restaurantId":"rest_1"}'

[DEV] Alternative (using 127.0.0.1):
      curl -X POST http://127.0.0.1:3000/api/v1/auth/dev-login \
        -H "Content-Type: application/json" \
        -d '{"role":"KITCHEN","restaurantId":"rest_1"}'
```

## Comandos de Verificación

### Con localhost
```bash
curl -X POST http://localhost:3000/api/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"role":"KITCHEN","restaurantId":"rest_1"}'
```

### Con 127.0.0.1
```bash
curl -X POST http://127.0.0.1:3000/api/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"role":"KITCHEN","restaurantId":"rest_1"}'
```

### Response Esperado (200 OK)
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

## Confirmación

✅ **Servidor escucha en IPv4** (`0.0.0.0`)  
✅ **Accesible desde `localhost`**  
✅ **Accesible desde `127.0.0.1`**  
✅ **Logs muestran URLs IPv4 explícitamente**  
✅ **Comandos curl funcionan en Git Bash (Windows)**  
✅ **No hay confusión con IPv6**

## Notas Técnicas

- `0.0.0.0` significa "todas las interfaces IPv4"
- En Windows, esto permite conexiones desde:
  - `localhost` (resuelve a 127.0.0.1)
  - `127.0.0.1` (loopback IPv4)
  - IP de red local (si hay)
- No usa IPv6, evitando problemas de compatibilidad en Windows
