# Debugging de Rutas - Solución Implementada

## Problema Identificado

El usuario veía solo un H1 "RestauranteApp - Web Dashboard" en `http://localhost:3001` porque:

1. **`apps/web/src/app/page.tsx`** tenía un componente simple que solo mostraba un H1, sin lógica de redirect
2. No había verificación de token en la home route "/"
3. El login redirigía a "/" pero "/" no manejaba el token

## Solución Implementada

### 1. Home Route ("/") - `apps/web/src/app/page.tsx`

**ANTES:**
```tsx
export default function Home() {
  return (
    <main>
      <h1>RestauranteApp - Web Dashboard</h1>
    </main>
  );
}
```

**DESPUÉS:**
- Convertido a Client Component (`'use client'`)
- Verifica token en localStorage usando `useAuthStore`
- Si no hay token → redirect a `/login`
- Si hay token → redirect a `/kitchen`
- Muestra loading mientras verifica

### 2. Login - `apps/web/src/app/login/page.tsx`

**Mejora:**
- Ahora redirige directamente a `/kitchen` después de guardar el token
- (Antes redirigía a "/" que no hacía nada)

### 3. Layout Raíz - `apps/web/src/app/layout.tsx`

**Mejora:**
- Agregado import de `./globals.css` para que los estilos se apliquen
- Cambiado lang a "es"

## Estructura de Rutas (App Router)

```
apps/web/src/app/
├── layout.tsx              # Layout raíz (importa globals.css)
├── page.tsx                # Home "/" - Client Component con redirect
├── login/
│   └── page.tsx            # Login - guarda token y redirige a /kitchen
└── (protected)/            # Grupo de rutas protegidas
    ├── layout.tsx          # Layout protegido (AppShell + WS bootstrap)
    ├── page.tsx            # Redirige según rol
    ├── kitchen/
    │   └── page.tsx        # Kitchen Board
    ├── waiter/
    │   └── page.tsx        # Vista Waiter
    ├── cashier/
    │   └── page.tsx        # Vista Cashier
    └── debug/
        └── realtime/
            └── page.tsx     # Debug Real-time
```

## Flujo de Navegación

1. **Usuario abre "/"**
   - `page.tsx` verifica token en localStorage
   - Si no hay token → `/login`
   - Si hay token → `/kitchen`

2. **Usuario en "/login"**
   - Pega token JWT
   - Click "Iniciar Sesión"
   - Guarda token en localStorage
   - Redirige a `/kitchen`

3. **Usuario en "/kitchen" (o cualquier ruta protegida)**
   - `(protected)/layout.tsx` se aplica
   - Verifica token
   - Conecta WebSocket
   - Carga snapshot inicial
   - Muestra AppShell con topbar y navegación

## Verificación del Puerto

**IMPORTANTE:** Verifica en la consola qué puerto imprime Next.js:

```bash
cd apps/web
pnpm dev
```

Next.js suele imprimir:
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3001
  - ready started server on 0.0.0.0:3001
```

**Si dice 3001, abre `http://localhost:3001`**

Si realmente está en 3001, puede ser:
- Otro proceso corriendo en 3000
- Configuración personalizada en `package.json`

## Checklist de Prueba

### Paso 1: Verificar que no hay Pages Router mezclado
```bash
# No debe existir apps/web/src/pages/
ls apps/web/src/pages  # Debe dar error "No such file or directory"
```
✅ **Confirmado:** No hay Pages Router, solo App Router

### Paso 2: Iniciar servidor
```bash
cd apps/web
pnpm dev
```

### Paso 3: Abrir el puerto correcto
- Mira la consola para ver el puerto exacto
- Abre `http://localhost:<PUERTO>` en el navegador

### Paso 4: Probar flujo completo

1. **Abrir "/"**
   - Debe redirigir automáticamente a `/login` (si no hay token)
   - O a `/kitchen` (si ya hay token guardado)

2. **En "/login"**
   - Pegar un JWT token válido
   - Click "Iniciar Sesión"
   - Debe redirigir a `/kitchen`

3. **En "/kitchen"**
   - Debe mostrar:
     - AppShell con topbar (RestauranteApp, rol, estado WS)
     - Navegación según rol
     - Kitchen Board con órdenes (si hay)

4. **En "/debug/realtime"**
   - Debe mostrar:
     - Estado de conexión WebSocket
     - Total de órdenes
     - Conteo por status
     - Lista de últimas 10 órdenes

## Archivos Modificados

1. ✅ `apps/web/src/app/page.tsx` - Convertido a Client Component con redirect
2. ✅ `apps/web/src/app/login/page.tsx` - Redirige a `/kitchen` directamente
3. ✅ `apps/web/src/app/layout.tsx` - Agregado import de globals.css

## Confirmaciones

- ✅ No hay Pages Router mezclado
- ✅ Home route "/" ahora hace redirect correcto
- ✅ Login redirige correctamente
- ✅ Layout protegido existe y se aplica
- ✅ Estilos globales se importan correctamente

## Próximos Pasos

Si aún no ves el AppShell:

1. **Verifica el puerto:** Abre el puerto exacto que dice la consola
2. **Limpia el cache:** 
   ```bash
   rm -rf apps/web/.next
   pnpm dev
   ```
3. **Verifica el token:** Asegúrate de tener un JWT válido con:
   - `userId`: string
   - `role`: `ADMIN` | `WAITER` | `KITCHEN` | `CASHIER`
   - `restaurantId`: string

4. **Abre directamente:** Prueba abrir directamente:
   - `http://localhost:<PUERTO>/kitchen`
   - `http://localhost:<PUERTO>/debug/realtime`
