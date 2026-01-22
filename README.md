# RestauranteApp

Plataforma de **servicio al cliente en tiempo real para restaurantes**, basada en **suscripción mensual**, diseñada para uso en **producción real**.

Combina **chat en tiempo real**, **automatización con IA** y **gestión centralizada de conversaciones** desde web y móvil.

---

## 🎯 Objetivo del Proyecto

Proveer a restaurantes una herramienta moderna para:

- Atender clientes por chat en tiempo real
- Automatizar respuestas frecuentes con IA
- Escalar atención humana + IA sin perder control
- Centralizar conversaciones, historial y métricas

⚠️ **No es un producto one-shot**  
El modelo de negocio es **SaaS por mensualidad** para restaurantes.

---

## 🧱 Arquitectura General

Monorepo orientado a **MVP → Producción**, optimizado para desarrollo asistido por IA (Cursor).

### Stack principal

- **Backend:** NestJS + WebSockets
- **Frontend Web:** React / Next.js
- **App móvil:** React Native (Expo)
- **Base de datos:** PostgreSQL
- **ORM:** Prisma
- **Tiempo real:** WebSockets
- **Lenguaje:** TypeScript end-to-end
- **Infra:** Monorepo (pnpm + workspaces)

---

## 📂 Estructura del Repositorio

```txt
RestauranteApp/
│
├─ apps/
│  ├─ web/                # Dashboard web (restaurantes / agentes)
│  ├─ mobile/             # App móvil (clientes / agentes)
│
├─ backend/
│  ├─ src/
│  │  ├─ modules/         # Dominios (auth, chats, mensajes, etc.)
│  │  ├─ websocket/       # Gateway WS
│  │  └─ main.ts
│  └─ prisma/             # Esquema DB
│
├─ packages/
│  ├─ contracts/          # DTOs, tipos y eventos WS compartidos
│  ├─ ui/                 # Componentes UI compartidos
│  └─ utils/              # Helpers comunes
│
├─ docs/
│  ├─ mvp-definition.md
│  ├─ architecture.md
│  └─ api-contracts.md
│
├─ .env.example
├─ package.json
├─ turbo.json
└─ README.md

---

## 🚀 Desarrollo Local

### Requisitos Previos

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL (para el backend)

### Puertos

- **Backend (NestJS)**: `http://localhost:3001`
  - API REST: `http://localhost:3001/api/v1/*`
  - WebSocket: `http://localhost:3001`
- **Frontend Web (Next.js)**: `http://localhost:3000`

### Inicio Rápido

1. **Instalar dependencias:**
   ```bash
   pnpm install
   ```

2. **Configurar variables de entorno:**

   **Backend** (`backend/.env`):
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/restauranteapp"
   JWT_SECRET="your-secret-key-change-in-production"
   JWT_EXPIRES_IN="7d"
   NODE_ENV="development"
   PORT=3001
   ```

   **Frontend Web** (`apps/web/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
   NEXT_PUBLIC_WS_URL=http://localhost:3001
   ```

3. **Iniciar servicios:**

   **Opción 1: Todo junto (Turbo)**
   ```bash
   pnpm dev
   ```

   **Opción 2: Por separado**
   ```bash
   # Terminal 1: Backend
   pnpm dev:backend

   # Terminal 2: Frontend Web
   pnpm dev:web
   ```

### Verificación

**Backend:**
```bash
# Verificar rutas disponibles
curl -i http://localhost:3001/api/v1/__routes

# Probar dev-login (solo en development)
curl -X POST http://localhost:3001/api/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"role":"KITCHEN","restaurantId":"rest_1"}'
```

**Frontend:**
- Abrir `http://localhost:3000/login` en el navegador
- Debería mostrar la pantalla de login

---

## 📝 Scripts Disponibles

### Raíz del proyecto

- `pnpm dev` - Inicia todos los servicios en modo desarrollo
- `pnpm dev:backend` - Inicia solo el backend (puerto 3001)
- `pnpm dev:web` - Inicia solo el frontend web (puerto 3000)
- `pnpm build` - Construye todos los proyectos
- `pnpm lint` - Ejecuta linters en todos los proyectos
- `pnpm test` - Ejecuta tests en todos los proyectos

### Backend

Ver `backend/README.md` para scripts específicos del backend.

### Frontend Web

Ver `apps/web/README.md` para scripts específicos del frontend.
