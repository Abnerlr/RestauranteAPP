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
