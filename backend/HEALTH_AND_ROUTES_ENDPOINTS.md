# Endpoints de Salud y Rutas

## Endpoints Sin Prefijo

Estos endpoints están disponibles **sin** el global prefix `api/v1` para facilitar el diagnóstico y verificación del servidor.

### GET `/__health`

Endpoint de salud que siempre está disponible (en desarrollo y producción).

**Request:**
```bash
curl -i http://localhost:3001/__health
```

**Response (200 OK):**
```json
{
  "ok": true,
  "name": "restaurante-app-backend",
  "port": 3001,
  "nodeEnv": "development",
  "globalPrefix": "api/v1"
}
```

**Uso:**
- Verificar que el servidor está corriendo
- Confirmar el puerto en el que está escuchando
- Ver el global prefix configurado
- Verificar el entorno (development/production)

### GET `/__routes`

Endpoint de diagnóstico que lista todas las rutas registradas. **Solo disponible en `NODE_ENV=development`**. En producción retorna 404.

**Request:**
```bash
curl -s http://localhost:3001/__routes | jq
```

**Response (200 OK en development):**
```json
{
  "routes": [
    {
      "method": "GET",
      "path": "/__health"
    },
    {
      "method": "GET",
      "path": "/__routes"
    },
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

**Uso:**
- Ver todas las rutas disponibles en el servidor
- Confirmar que las rutas tienen el prefijo correcto
- Debugging de routing
- Verificar que endpoints específicos están registrados

**Ejemplo: Verificar que dev-login existe:**
```bash
# Linux/Mac/Git Bash
curl -s http://localhost:3001/__routes | grep "dev-login"

# Windows PowerShell
curl -s http://localhost:3001/__routes | Select-String "dev-login"
```

## Logs de Arranque

Al iniciar el backend, verás logs como estos:

```
============================================================
[BOOT] Application started
[BOOT] Listening on: 0.0.0.0:3001 (IPv4)
[BOOT] http://localhost:3001
[BOOT] NODE_ENV: development
[BOOT] Global prefix: api/v1
[BOOT] Health: http://localhost:3001/__health
[DEV] Routes: http://localhost:3001/__routes
============================================================

[DEV] Dev login endpoint:
      POST http://localhost:3001/api/v1/auth/dev-login

[DEV] Test command (Linux/Mac/Git Bash):
      curl -X POST http://localhost:3001/api/v1/auth/dev-login \
        -H "Content-Type: application/json" \
        -d '{"role":"KITCHEN","restaurantId":"rest_1"}'
```

## Verificación Completa

### 1. Verificar que el servidor está corriendo

```bash
curl -i http://localhost:3001/__health
```

**Esperado:** 200 OK con JSON mostrando `ok: true`, `port: 3001`, `globalPrefix: "api/v1"`

### 2. Ver todas las rutas (solo en development)

```bash
curl -s http://localhost:3001/__routes
```

**Esperado:** 200 OK con JSON listando todas las rutas, incluyendo `/api/v1/auth/dev-login`

### 3. Verificar que dev-login está disponible

```bash
# Verificar en la lista de rutas
curl -s http://localhost:3001/__routes | grep "dev-login"

# Probar el endpoint directamente
curl -X POST http://localhost:3001/api/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"role":"KITCHEN","restaurantId":"rest_1"}'
```

**Esperado:** 
- En `__routes`: Debe aparecer `"path": "/api/v1/auth/dev-login"`
- En `dev-login`: Debe retornar 200 OK con `access_token`

## Implementación

Los endpoints están implementados en `backend/src/app.controller.ts` usando `@Controller()` sin prefijo, lo que significa que **no** están afectados por `app.setGlobalPrefix('api/v1')`.

El controller está registrado directamente en `AppModule`, asegurando que siempre esté disponible.

## Seguridad

- `/__health`: Disponible en todos los entornos (útil para health checks de producción)
- `/__routes`: Solo disponible en `NODE_ENV=development` (retorna 404 en producción)
