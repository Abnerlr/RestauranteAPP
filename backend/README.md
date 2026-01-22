# RestauranteApp - Backend

NestJS backend API server with WebSocket support.

## Development

```bash
pnpm dev
```

## Environment Variables

Create a `.env` file in the `backend` directory with:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/restauranteapp"

# JWT
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"  # Optional: 7d, 24h, 3600s, etc.

# Server
NODE_ENV="development"
PORT=3001

# Development Features
# Set to 'true', '1', 'yes', or 'on' (case-insensitive) to enable dev-login endpoint
# ⚠️ NEVER set this to true in production
DEV_LOGIN_ENABLED=true
```

## Database

```bash
# Generate Prisma Client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Open Prisma Studio
pnpm prisma:studio
```

## Development Login Endpoint

**⚠️ ONLY available when `DEV_LOGIN_ENABLED=true` (or '1', 'yes', 'on')**

For quick testing, use the dev-login endpoint to generate valid JWT tokens.

**Important:** This endpoint is controlled by the `DEV_LOGIN_ENABLED` environment variable, not `NODE_ENV`. Set `DEV_LOGIN_ENABLED=true` in your `.env` file to enable it.

**Endpoint:** `POST /api/v1/auth/dev-login`

**Request:**
```bash
curl -X POST http://localhost:3001/api/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{
    "role": "KITCHEN",
    "restaurantId": "rest_1",
    "userId": "optional-user-id"  # Optional, will be auto-generated if not provided
  }'
```

**Windows PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/dev-login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"role":"KITCHEN","restaurantId":"rest_1"}'
```

**Response:**
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

## Development Routes Debug Endpoint

**⚠️ ONLY available in development mode (NODE_ENV=development)**

Debug endpoint to list all registered routes.

**Endpoint:** `GET /api/v1/__routes`

**Request:**
```bash
curl http://localhost:3001/api/v1/__routes
```

**Response:**
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

**Response:**
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

**Available roles:**
- `ADMIN`
- `WAITER`
- `KITCHEN`
- `CASHIER`

**Security:**
- This endpoint returns 404 if `DEV_LOGIN_ENABLED` is not set to `true` (or '1', 'yes', 'on')
- ⚠️ **NEVER** set `DEV_LOGIN_ENABLED=true` in production
- Tokens are signed with the same JWT_SECRET as production tokens
- Tokens work with both REST API and WebSocket authentication
