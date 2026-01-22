# Implementación Kitchen Board + App Shell

## Resumen

Se ha implementado el App Shell profesional y el Kitchen Board realtime-first para la aplicación web Next.js.

## Archivos Creados/Modificados

### Design Tokens y Estilos

1. **`src/app/globals.css`** (modificado)
   - Variables CSS para design tokens
   - Colores, spacing, border radius, shadows
   - Tipografía system-ui
   - Clase `.container` para contenedor centrado

### Componentes UI

2. **`src/ui/utils.ts`**
   - Función `cn()` para combinar class names

3. **`src/ui/Badge.module.css`** + **`src/ui/Badge.tsx`**
   - Componente Badge con variantes: success, warn, danger, info, muted

4. **`src/ui/Card.module.css`** + **`src/ui/Card.tsx`**
   - Componente Card con CardHeader, CardTitle, CardContent
   - Soporte para highlight animation

5. **`src/ui/Button.module.css`** + **`src/ui/Button.tsx`**
   - Componente Button con variantes: primary, ghost, danger
   - Tamaños: default, sm

6. **`src/ui/AppShell.module.css`** + **`src/ui/AppShell.tsx`**
   - Layout principal con topbar
   - Navegación según rol
   - Banner de estado de conexión
   - Responsive

7. **`src/ui/index.ts`**
   - Exports centralizados de componentes UI

### Features (Órdenes)

8. **`src/features/orders/store/orders.selectors.ts`**
   - `useKitchenOrders()`: Selector para órdenes de cocina
   - Separa en "En preparación" e "Listas"
   - Ordena por tiempo (más recientes primero)

9. **`src/features/orders/api/orders.api.ts`** (modificado)
   - `updateOrderItemStatus()`: Mutation REST para cambiar estado de item

10. **`src/features/orders/store/orders.store.ts`** (modificado)
    - `setItemStatusOptimistic()`: Acción para update optimista
    - Retorna función de rollback

11. **`src/features/orders/components/OrderCard.module.css`** + **`src/features/orders/components/OrderCard.tsx`**
    - Componente OrderCard para mostrar orden con items
    - Botones de acción por item (Start/Done)
    - Manejo de estados optimistas
    - Rollback en caso de error

### Rutas

12. **`src/app/(protected)/layout.tsx`** (modificado)
    - Integrado AppShell
    - Pasa role y socketStatus al shell

13. **`src/app/(protected)/kitchen/page.tsx`**
    - Kitchen Board completo
    - Secciones: "En preparación" y "Listas"
    - Highlight de nuevas órdenes (2s)
    - Grid responsive

14. **`src/app/(protected)/kitchen/kitchen.module.css`**
    - Estilos del Kitchen Board

15. **`src/app/(protected)/waiter/page.tsx`** (modificado)
    - UI mejorada dentro del shell
    - Link a debug

16. **`src/app/(protected)/waiter/waiter.module.css`**
    - Estilos de la página waiter

17. **`src/app/(protected)/cashier/page.tsx`** (modificado)
    - UI mejorada dentro del shell
    - Link a debug

18. **`src/app/(protected)/cashier/cashier.module.css`**
    - Estilos de la página cashier

### Configuración

19. **`next.config.js`** (modificado)
    - Agregado `transpilePackages: ['@restaurante-app/contracts']`

20. **`packages/contracts/src/types/payments.ts`** (modificado)
    - Agregado export para que TypeScript lo reconozca como módulo

## Características Implementadas

### ✅ App Shell Profesional
- Topbar con nombre de app, rol y estado WS
- Navegación según rol (KITCHEN, WAITER, CASHIER, ADMIN)
- Banner de reconexión cuando WS está desconectado
- Layout consistente en todas las páginas protegidas

### ✅ Kitchen Board Realtime
- Lista de órdenes relevantes (no cerradas)
- Separación en "En preparación" y "Listas"
- Tarjetas de órdenes con items y estados
- Botones de acción por item (Start/Done)
- Update optimista con rollback
- Highlight de nuevas órdenes (2 segundos)
- Actualización en tiempo real por WebSocket

### ✅ Mutations Optimistas
- Cambio de estado de item con update optimista
- Rollback automático en caso de error
- Reconciliación por eventos WS (sin duplicados)

### ✅ Feedback UX
- Highlight sutil de nuevas órdenes
- Banner de estado de conexión
- Mensajes de error inline
- Estados de carga en botones

### ✅ Sin Polling
- Todo es push por WebSocket
- REST solo para snapshot inicial y mutations

## Cómo Probar

### 1. Compilar Contracts (si no está compilado)
```bash
cd packages/contracts
pnpm run build
```

### 2. Iniciar Desarrollo
```bash
cd apps/web
pnpm dev
```

### 3. Probar Kitchen Board

1. Abre `/kitchen` con un token de rol KITCHEN
2. Abre otra pestaña con `/waiter` (rol WAITER)
3. Desde waiter o backend, crea y confirma una orden
4. La orden debería aparecer en tiempo real en Kitchen Board
5. La tarjeta se resalta por 2 segundos
6. Prueba cambiar el estado de un item:
   - Click en "Start" (PENDING → IN_PROGRESS)
   - Click en "Done" (IN_PROGRESS → READY)
7. Verifica que:
   - El cambio se refleja inmediatamente (optimistic)
   - Si hay error, se hace rollback
   - El evento WS reconcilia el estado final

### 4. Verificar App Shell

- Topbar visible en todas las páginas protegidas
- Navegación según rol
- Estado WS visible (badge)
- Banner de reconexión cuando está desconectado

## Flujo de Datos

1. **Snapshot inicial**: Al conectar WS, se carga snapshot REST
2. **Eventos WS**: `order.new`, `order.item.status.changed`, `order.status.changed`
3. **Mutations**: Click en botón → update optimista → REST API → WS reconcilia
4. **Dedupe**: Eventos duplicados se ignoran automáticamente

## Notas Técnicas

- Los componentes UI usan CSS Modules
- Design tokens en variables CSS
- No se agregaron dependencias pesadas
- Tipos estrictos desde `@restaurante-app/contracts`
- Código modular y mantenible

## Próximos Pasos

- [ ] Implementar pantallas funcionales para Waiter y Cashier
- [ ] Agregar más feedback visual (toasts, sonidos opcionales)
- [ ] Mejorar accesibilidad (ARIA labels, keyboard navigation)
- [ ] Agregar tests unitarios para componentes
- [ ] Optimizar rendimiento (virtualización si hay muchas órdenes)
