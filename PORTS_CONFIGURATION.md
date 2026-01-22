# Configuración de Puertos - RestauranteApp

## Puertos Estándar

- **Backend (NestJS)**: `http://localhost:3001`
  - API REST: `http://localhost:3001/api/v1/*`
  - WebSocket: `http://localhost:3001`
  
- **Frontend Web (Next.js)**: `http://localhost:3000`

## Configuración

### Backend

**Archivo:** `backend/.env`
```env
PORT=3001
# o
API_PORT=3001
```

**Código:** `backend/src/main.ts`
- Usa `process.env.PORT ?? process.env.API_PORT ?? 3001`
- Escucha en `0.0.0.0:3001` (IPv4)

### Frontend Web

**Archivo:** `apps/web/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

**Código:**
- `apps/web/package.json`: `"dev": "next dev -p 3000"`
- `apps/web/src/core/api/http.ts`: Default `http://localhost:3001/api/v1`
- `apps/web/src/core/socket/socket.client.ts`: Default `http://localhost:3001`

## Scripts de Desarrollo

### Desde la raíz del proyecto:

```bash
# Iniciar todo (Turbo)
pnpm dev

# Solo backend
pnpm dev:backend

# Solo frontend web
pnpm dev:web
```

## Verificación

### Backend (puerto 3001)

```bash
# Verificar rutas disponibles
curl -i http://localhost:3001/api/v1/__routes

# Probar dev-login
curl -X POST http://localhost:3001/api/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"role":"KITCHEN","restaurantId":"rest_1"}'
```

### Frontend Web (puerto 3000)

- Abrir `http://localhost:3000/login` en el navegador
- Debería mostrar la pantalla de login

## Troubleshooting

### Backend no responde en 3001

1. Verificar que `backend/.env` tenga `PORT=3001` o `API_PORT=3001`
2. Verificar que no haya otro proceso usando el puerto 3001:
   ```bash
   # Windows
   netstat -ano | findstr :3001
   
   # Linux/Mac
   lsof -i :3001
   ```
3. Reiniciar el backend

### Frontend no responde en 3000

1. Verificar que `apps/web/package.json` tenga `"dev": "next dev -p 3000"`
2. Verificar que no haya otro proceso usando el puerto 3000
3. Limpiar cache de Next.js:
   ```bash
   cd apps/web
   rm -rf .next
   pnpm dev
   ```

### Frontend no se conecta al backend

1. Verificar que `apps/web/.env.local` tenga:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
   NEXT_PUBLIC_WS_URL=http://localhost:3001
   ```
2. Verificar que el backend esté corriendo en 3001
3. Verificar en la consola del navegador si hay errores de CORS o conexión
