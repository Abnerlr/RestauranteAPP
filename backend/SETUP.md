# Backend Setup Guide

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL database

## Quick Start

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Run database migration:**
   ```bash
   pnpm prisma:generate
   pnpm prisma:migrate dev --name init
   ```

4. **Start development server:**
   ```bash
   pnpm dev
   ```

   Or from root:
   ```bash
   pnpm --filter @restaurante-app/backend dev
   ```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login endpoint
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

### Bootstrap (First Restaurant)
- `POST /api/v1/restaurants/bootstrap` - Create first restaurant and admin
  ```json
  {
    "restaurantName": "Mi Restaurante",
    "adminEmail": "admin@restaurante.com",
    "adminPassword": "password123",
    "adminName": "Admin User",
    "bootstrapSecret": "your-secret"
  }
  ```

## Guards Usage

### JWT Authentication
```typescript
@UseGuards(JwtAuthGuard)
@Get('protected')
async protectedRoute(@ReqUser() user: CurrentUser) {
  return { message: `Hello ${user.userId}` };
}
```

### Role-based Access
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.WAITER)
@Get('admin-only')
async adminRoute() {
  return { message: 'Admin access' };
}
```

### Tenant Context
```typescript
@UseGuards(JwtAuthGuard, TenantGuard)
@Get('tenant-scoped')
async tenantRoute(@ReqRestaurantId() restaurantId: string) {
  // restaurantId is automatically available
  return { restaurantId };
}
```

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── common/
│   │   ├── decorators/         # @ReqUser(), @Roles(), etc.
│   │   ├── guards/             # JwtAuthGuard, RolesGuard, TenantGuard
│   │   └── types/               # TypeScript types
│   ├── modules/
│   │   ├── auth/               # Authentication module
│   │   ├── restaurants/        # Restaurants module
│   │   └── prisma/             # Prisma service (global)
│   ├── app.module.ts
│   └── main.ts
└── package.json
```

## Building for Production

```bash
pnpm build
pnpm start
```
