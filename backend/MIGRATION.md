# Database Migration Instructions

## Initial Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the `backend/` directory with:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/restauranteapp?schema=public"
   JWT_SECRET="your-secret-key-here-change-in-production"
   JWT_EXPIRES_IN="7d"
   BOOTSTRAP_SECRET="your-bootstrap-secret-here"
   API_PORT=3000
   ```

3. **Generate Prisma Client:**
   ```bash
   cd backend
   pnpm prisma:generate
   ```

4. **Create and run migration:**
   ```bash
   pnpm prisma:migrate dev --name init
   ```
   
   This will:
   - Create the migration files in `prisma/migrations/`
   - Apply the migration to your database
   - Generate the Prisma Client

5. **Verify the migration:**
   ```bash
   pnpm prisma:studio
   ```
   This opens Prisma Studio where you can view your database tables.

## Bootstrap First Restaurant

After running the migration, you can create your first restaurant and admin user using the bootstrap endpoint:

```bash
curl -X POST http://localhost:3000/api/v1/restaurants/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantName": "Mi Restaurante",
    "adminEmail": "admin@restaurante.com",
    "adminPassword": "password123",
    "adminName": "Admin User",
    "bootstrapSecret": "your-bootstrap-secret-here"
  }'
```

**Note:** The bootstrap endpoint is only available if:
- No restaurants exist in the database, OR
- A valid `bootstrapSecret` is provided in the request body

## Alternative: Manual Database Setup

If you prefer to create the first restaurant manually:

1. Use Prisma Studio:
   ```bash
   pnpm prisma:studio
   ```

2. Or use a SQL client to insert directly:
   ```sql
   INSERT INTO restaurants (id, name, status, timezone, "createdAt", "updatedAt")
   VALUES (gen_random_uuid(), 'Mi Restaurante', 'ACTIVE', 'America/Mexico_City', NOW(), NOW());

   -- Then create a user (you'll need to hash the password first using bcrypt)
   ```

## Production Migration

For production, use:
```bash
pnpm prisma migrate deploy
```

This applies pending migrations without prompting for a migration name.
