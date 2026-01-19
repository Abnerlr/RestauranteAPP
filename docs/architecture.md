# Architecture Documentation

## System Overview

RestauranteApp is a monorepo-based SaaS platform for restaurant customer service.

## Technology Stack

### Backend
- **Framework:** NestJS
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Real-time:** WebSockets (Socket.IO)
- **Authentication:** JWT (JSON Web Tokens)

### Frontend Web
- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** [To be defined]

### Mobile
- **Framework:** React Native (Expo)
- **Language:** TypeScript
- **Navigation:** Expo Router

### Infrastructure
- **Monorepo:** pnpm workspaces + Turborepo
- **Package Manager:** pnpm
- **Build System:** Turborepo

## Architecture Patterns

### Monorepo Structure
- `apps/` - Applications (web, mobile)
- `backend/` - Backend API server
- `packages/` - Shared packages (contracts, ui, utils)

### Module Organization
- Feature-based modules in backend
- Shared contracts for type safety
- Reusable UI components

## Multi-Tenancy & Authentication

### Tenant Isolation
The system implements **row-level security** through multi-tenancy:
- Each restaurant is a separate tenant identified by `restaurant_id`
- All data operations are automatically scoped to the user's `restaurant_id`
- Users can only access data belonging to their restaurant
- Database queries are filtered by `restaurant_id` at the application layer

### JWT Token Structure
JWT tokens include the following claims:
```typescript
{
  userId: string;        // User unique identifier
  role: Role;            // User role (ADMIN, WAITER, KITCHEN, CASHIER)
  restaurantId: string;  // Restaurant tenant identifier
}
```

### Role-Based Access Control (RBAC)
The system defines four roles:

- **ADMIN**: Restaurant owner/manager
  - Full access to restaurant settings
  - User management
  - All operational features

- **WAITER**: Service staff
  - Table management
  - Order creation and management
  - Customer interaction

- **KITCHEN**: Kitchen staff
  - View and update order status
  - Kitchen display system access

- **CASHIER**: Payment processing staff
  - Process payments
  - Handle checkout requests
  - Financial operations

### Security Guards
- **JwtAuthGuard**: Validates JWT token and extracts user context
- **TenantGuard**: Ensures all requests are scoped to user's `restaurant_id`
- **RolesGuard**: Enforces role-based permissions

## Data Flow

1. Client applications (web/mobile) authenticate and receive JWT token
2. JWT token includes `restaurantId` for tenant isolation
3. All API requests include JWT token in Authorization header
4. Backend validates token and extracts `restaurantId`
5. All database queries are automatically filtered by `restaurant_id`
6. Real-time updates via WebSocket connections (scoped by `restaurant_id`)
7. Shared contracts ensure type safety across all applications

## Deployment Strategy

[To be defined]
