# 🚀 Guía de Inicio Rápido - RestauranteApp

## Requisitos Previos

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **PostgreSQL** (corriendo localmente o remoto)

---

## Paso 1: Instalar Dependencias

Desde la **raíz del proyecto**:

```bash
pnpm install
```

Esto instalará todas las dependencias del monorepo (backend, frontend, packages compartidos).

---

## Paso 2: Configurar Base de Datos

### 2.1. Crear Base de Datos PostgreSQL

Crea una base de datos PostgreSQL:

```sql
CREATE DATABASE restauranteapp;
```

O desde línea de comandos:

```bash
# Si tienes psql instalado
createdb restauranteapp

# O conecta y ejecuta:
psql -U postgres
CREATE DATABASE restauranteapp;
\q
```

### 2.2. Configurar Variables de Entorno del Backend

Crea el archivo `backend/.env`:

```bash
cd backend
```

Crea `backend/.env` con el siguiente contenido:

```env
# Database
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/restauranteapp"

# JWT
JWT_SECRET="dev-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
NODE_ENV="development"
PORT=3001
```

**⚠️ Reemplaza `usuario` y `contraseña` con tus credenciales de PostgreSQL.**

### 2.3. Ejecutar Migraciones

Desde `backend/`:

```bash
# Generar Prisma Client
pnpm prisma:generate

# Ejecutar migraciones
pnpm prisma:migrate

# (Opcional) Abrir Prisma Studio para ver la DB
pnpm prisma:studio
```

---

## Paso 3: Iniciar el Backend

Desde la **raíz del proyecto** o desde `backend/`:

```bash
# Opción 1: Desde la raíz
pnpm dev:backend

# Opción 2: Desde backend/
cd backend
pnpm dev
```

**Verifica que el backend esté corriendo:**

Deberías ver en la consola:
```
============================================================
[BOOT] Application started
[BOOT] Listening on: 0.0.0.0:3001 (IPv4)
[BOOT] http://localhost:3001
[BOOT] NODE_ENV: development
[BOOT] Global prefix: api/v1
[BOOT] Health: http://localhost:3001/api/v1/__health
[DEV] Routes: http://localhost:3001/api/v1/__routes
============================================================
```

**Prueba que funciona:**

Abre otra terminal y ejecuta:

```bash
# Probar health endpoint
curl -i http://localhost:3001/api/v1/__health

# Probar dev-login (obtener token)
curl -X POST http://localhost:3001/api/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"role":"KITCHEN","restaurantId":"rest_1"}'
```

Deberías recibir un `access_token` en la respuesta.

---

## Paso 4: Configurar Variables de Entorno del Frontend

Crea el archivo `apps/web/.env.local`:

```bash
cd apps/web
```

Crea `apps/web/.env.local` con:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

---

## Paso 5: Iniciar el Frontend

Desde la **raíz del proyecto** o desde `apps/web/`:

```bash
# Opción 1: Desde la raíz
pnpm dev:web

# Opción 2: Desde apps/web/
cd apps/web
pnpm dev
```

**Verifica que el frontend esté corriendo:**

Deberías ver:
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - ready started server on 0.0.0.0:3000
```

---

## Paso 6: Acceder a la Aplicación

1. **Abre el navegador:** `http://localhost:3000`

2. **Obtén un token JWT** (en otra terminal):
   ```bash
   curl -X POST http://localhost:3001/api/v1/auth/dev-login \
     -H "Content-Type: application/json" \
     -d '{"role":"KITCHEN","restaurantId":"rest_1"}'
   ```

3. **Copia el `access_token`** de la respuesta.

4. **En el navegador:**
   - Ve a `http://localhost:3000/login`
   - Pega el token JWT
   - Haz clic en "Iniciar Sesión"

5. **Serás redirigido a `/kitchen`** y verás el Kitchen Board KDS.

---

## Comandos Útiles

### Desde la raíz:

```bash
# Instalar dependencias
pnpm install

# Iniciar todo (backend + frontend con Turbo)
pnpm dev

# Solo backend
pnpm dev:backend

# Solo frontend
pnpm dev:web
```

### Backend:

```bash
cd backend

# Desarrollo (con watch)
pnpm dev

# Generar Prisma Client
pnpm prisma:generate

# Ejecutar migraciones
pnpm prisma:migrate

# Abrir Prisma Studio (interfaz visual de la DB)
pnpm prisma:studio

# Build
pnpm build

# Iniciar producción
pnpm start
```

### Frontend:

```bash
cd apps/web

# Desarrollo
pnpm dev

# Build
pnpm build

# Iniciar producción
pnpm start
```

---

## Verificación Rápida

### Backend está funcionando si:

```bash
# Health check retorna 200
curl -i http://localhost:3001/api/v1/__health

# Dev login retorna access_token
curl -X POST http://localhost:3001/api/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"role":"KITCHEN","restaurantId":"rest_1"}'
```

### Frontend está funcionando si:

- Abres `http://localhost:3000` y ves la pantalla de login
- Puedes pegar un token y hacer login
- Te redirige a `/kitchen` y ves el Kitchen Board (vacío o con órdenes)

---

## Troubleshooting

### Error: "Cannot find module '@restaurante-app/contracts'"

```bash
# Desde la raíz
pnpm install
```

### Error: "Prisma Client not generated"

```bash
cd backend
pnpm prisma:generate
```

### Error: "Database connection failed"

1. Verifica que PostgreSQL esté corriendo:
   ```bash
   # Windows (si está en servicios)
   # Verifica en Services

   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. Verifica que `DATABASE_URL` en `backend/.env` sea correcta.

3. Prueba conectarte manualmente:
   ```bash
   psql -U usuario -d restauranteapp
   ```

### Frontend no se conecta al backend

1. Verifica que el backend esté corriendo en `http://localhost:3001`
2. Verifica `apps/web/.env.local` tenga:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
   NEXT_PUBLIC_WS_URL=http://localhost:3001
   ```
3. Reinicia el frontend después de crear `.env.local`

### Puerto ya en uso

Si el puerto 3001 o 3000 está ocupado:

- **Backend:** Cambia `PORT=3001` en `backend/.env`
- **Frontend:** Cambia `-p 3000` en `apps/web/package.json` script `dev`

---

## Estructura de Terminales Recomendada

**Terminal 1: Backend**
```bash
cd backend
pnpm dev
```

**Terminal 2: Frontend**
```bash
cd apps/web
pnpm dev
```

**Terminal 3: Comandos adicionales** (curl, prisma, etc.)

---

## Próximos Pasos

1. ✅ Backend corriendo en `http://localhost:3001`
2. ✅ Frontend corriendo en `http://localhost:3000`
3. ✅ Token JWT obtenido del dev-login
4. ✅ Login exitoso en el frontend
5. ✅ Ver Kitchen Board en `/kitchen`

**Para probar órdenes reales:**
- Usa el backend API para crear órdenes
- O implementa el módulo Waiter para crear órdenes desde la UI
- Las órdenes aparecerán en tiempo real en el Kitchen Board
