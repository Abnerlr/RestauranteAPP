# Dev Login Endpoint - Implementación

## Resumen

Se ha implementado el endpoint `POST /api/v1/auth/dev-login` que permite generar tokens JWT válidos **únicamente en modo desarrollo** para facilitar las pruebas del frontend.

## Archivos Creados/Modificados

### DTOs

1. **`backend/src/modules/auth/dto/dev-login.dto.ts`**
   - `DevLoginDto`: Request DTO con validación
   - Campos:
     - `role`: Enum Role (ADMIN, WAITER, KITCHEN, CASHIER)
     - `restaurantId`: string (requerido)
     - `userId`: string (opcional, se genera automáticamente si no se proporciona)

2. **`backend/src/modules/auth/dto/dev-login-response.dto.ts`**
   - `DevLoginResponseDto`: Response DTO
   - Campos:
     - `access_token`: JWT token firmado
     - `token_type`: "Bearer"
     - `expires_in`: Segundos hasta expiración
     - `user`: Objeto con id, role, restaurantId

### Service

3. **`backend/src/modules/auth/auth.service.ts`** (modificado)
   - Agregado método `devLogin()`:
     - Valida que NODE_ENV === 'development'
     - Genera userId si no se proporciona: `dev-{role}-{timestamp}`
     - Crea payload JWT con userId, role, restaurantId
     - Firma token con JwtService
     - Calcula expires_in en segundos
   - Agregado método privado `parseExpiresIn()`:
     - Convierte string (ej: "7d", "24h") a segundos

### Controller

4. **`backend/src/modules/auth/auth.controller.ts`** (modificado)
   - Agregado endpoint `POST /api/v1/auth/dev-login`
   - Validación doble de NODE_ENV (defense in depth)
   - Retorna 404 si no está en development

### Documentación

5. **`backend/README.md`** (modificado)
   - Agregada sección "Development Login Endpoint"
   - Ejemplos de request/response
   - Notas de seguridad

## Características

### ✅ Seguridad

- **Solo disponible en development**: Retorna 404 en producción
- **Validación doble**: Tanto en controller como en service
- **Mismo secret**: Usa JWT_SECRET del backend (tokens válidos para REST y WS)

### ✅ Funcionalidad

- **Generación automática de userId**: Si no se proporciona, genera `dev-{role}-{timestamp}`
- **Expiración configurable**: Respeta JWT_EXPIRES_IN del .env
- **Validación de DTOs**: Usa class-validator para validar request

### ✅ Compatibilidad

- **REST API**: Token funciona con todos los guards existentes
- **WebSocket**: Token funciona con handshake JWT del WebSocket gateway
- **Multi-tenant**: Token incluye restaurantId para room isolation

## Uso

### Ejemplo con cURL

```bash
curl -X POST http://localhost:3000/api/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{
    "role": "KITCHEN",
    "restaurantId": "rest_1"
  }'
```

### Ejemplo con Postman

1. **Method**: POST
2. **URL**: `http://localhost:3000/api/v1/auth/dev-login`
3. **Headers**: `Content-Type: application/json`
4. **Body** (raw JSON):
```json
{
  "role": "KITCHEN",
  "restaurantId": "rest_1"
}
```

### Ejemplo con diferentes roles

```json
// Admin
{
  "role": "ADMIN",
  "restaurantId": "rest_1"
}

// Waiter
{
  "role": "WAITER",
  "restaurantId": "rest_1"
}

// Kitchen
{
  "role": "KITCHEN",
  "restaurantId": "rest_1"
}

// Cashier
{
  "role": "CASHIER",
  "restaurantId": "rest_1"
}
```

## Verificación

### 1. Probar REST API

```bash
# Obtener token
TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"role":"KITCHEN","restaurantId":"rest_1"}' \
  | jq -r '.access_token')

# Usar token en endpoint protegido
curl -X GET http://localhost:3000/api/v1/orders/active \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Probar WebSocket

```javascript
const io = require('socket.io-client');

// Obtener token primero (usar el token del dev-login)
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const socket = io('http://localhost:3000', {
  auth: {
    token: token
  },
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('Connected!');
  console.log('Socket ID:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});
```

### 3. Probar en Frontend

1. Abrir `/login` en el frontend
2. Obtener token del dev-login endpoint
3. Pegar token en el textarea
4. Click "Iniciar sesión"
5. Debe redirigir a `/kitchen` y conectar WebSocket

## Estructura del JWT

El token generado contiene:

```json
{
  "sub": "dev-kitchen-1234567890",
  "userId": "dev-kitchen-1234567890",
  "role": "KITCHEN",
  "restaurantId": "rest_1",
  "iat": 1234567890,
  "exp": 1235173890
}
```

## Variables de Entorno

Asegúrate de tener en tu `.env`:

```env
NODE_ENV=development
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d  # Opcional: 7d, 24h, 3600s, etc.
```

## Notas de Seguridad

1. **Nunca exponer en producción**: El endpoint retorna 404 automáticamente
2. **Mismo secret**: Los tokens son válidos como tokens de producción (mismo JWT_SECRET)
3. **Validación doble**: Tanto controller como service validan NODE_ENV
4. **No valida usuario real**: Este endpoint NO verifica contra la base de datos

## Troubleshooting

### Error 404 en development

- Verificar que `NODE_ENV=development` en `.env`
- Reiniciar el servidor después de cambiar `.env`

### Token no funciona en WebSocket

- Verificar que el token incluye `restaurantId` en el payload
- Verificar que JWT_SECRET es el mismo en backend y frontend (si aplica)

### Token expira muy rápido

- Ajustar `JWT_EXPIRES_IN` en `.env` (ej: `7d`, `30d`)
