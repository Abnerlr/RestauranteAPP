# Upgrade UI Profesional - Paso 1.5

## Resumen

Se ha transformado la UI del login y el App Shell para crear una identidad visual profesional, sobria y elegante con tema oscuro.

## Cambios Implementados

### 1. Design Tokens - Tema Oscuro Profesional

**Archivo:** `apps/web/src/app/globals.css`

- **Paleta de colores actualizada:**
  - Background: `#0f1115` (oscuro profesional)
  - Panel: `#161a22` (paneles elevados)
  - Text primary: `#e5e7eb` (texto claro)
  - Text muted: `#9ca3af` (texto secundario)
  - Border: `#232837` (bordes sutiles)
  - Accent: `#2563eb` (azul profesional)

- **Sombras ajustadas para tema oscuro:**
  - Sombras más pronunciadas para dar profundidad
  - Colores ajustados para contraste en fondo oscuro

### 2. Login UI Profesional

**Archivo:** `apps/web/src/app/login/page.tsx` + `login.module.css`

**Mejoras implementadas:**
- ✅ Card centrada con diseño limpio
- ✅ Título claro: "Iniciar sesión"
- ✅ Subtítulo: "Acceso al panel del restaurante"
- ✅ Textarea estilizado (monospace, fondo oscuro)
- ✅ Botón primario sobrio con estados (disabled, loading)
- ✅ Nota inferior discreta (muted)
- ✅ Soporte para `Ctrl+Enter` / `Cmd+Enter` para enviar
- ✅ Error visual mejorado (badge con fondo oscuro)
- ✅ Loading state durante autenticación
- ✅ Validación de token inválido con mensaje claro

**UX mejorada:**
- Botón deshabilitado si textarea vacío
- Loading state simple al guardar token
- Enter también envía (con Ctrl/Cmd)
- Error visual si token inválido

### 3. Componentes UI Actualizados

#### Badge Component
**Archivo:** `apps/web/src/ui/Badge.module.css`

- Colores ajustados para tema oscuro
- Fondo semitransparente con borde sutil
- Mejor contraste y legibilidad

#### AppShell
**Archivo:** `apps/web/src/ui/AppShell.module.css`

- Banner de reconexión con colores ajustados
- Navegación activa con fondo semitransparente
- Topbar con fondo oscuro profesional

### 4. Páginas Placeholder Mejoradas

Las páginas `/waiter` y `/cashier` ya estaban bien estructuradas, solo se ajustaron los estilos de links para mejor consistencia.

## Características Visuales

### Tipografía
- system-ui / Inter
- Jerarquía clara (h1, h2, body, muted)
- Tamaños consistentes

### Espaciado
- Sistema de spacing consistente
- Padding y margins uniformes
- Contenedor centrado con max-width

### Colores
- Paleta oscura profesional
- Sin colores chillones
- Sin gradientes
- Sin animaciones innecesarias

### Componentes
- Button: Variantes primary, ghost, danger
- Card: Panel elevado con sombra sutil
- Badge: Estados con colores semitransparentes

## Archivos Modificados

1. ✅ `apps/web/src/app/globals.css` - Design tokens tema oscuro
2. ✅ `apps/web/src/app/login/page.tsx` - Rediseño completo
3. ✅ `apps/web/src/app/login/login.module.css` - Estilos del login
4. ✅ `apps/web/src/ui/Badge.module.css` - Colores tema oscuro
5. ✅ `apps/web/src/ui/AppShell.module.css` - Ajustes tema oscuro
6. ✅ `apps/web/src/app/(protected)/waiter/waiter.module.css` - Ajustes menores
7. ✅ `apps/web/src/app/(protected)/cashier/cashier.module.css` - Ajustes menores

## Criterios de Aceptación

✅ **Login se ve profesional y usable**
- Card centrada con diseño limpio
- Textarea estilizado y funcional
- Botón con estados (disabled, loading)
- Error visual claro

✅ **Fondo, colores y tipografía consistentes**
- Tema oscuro aplicado globalmente
- Variables CSS consistentes
- Tipografía system-ui

✅ **App nunca muestra "pantalla vacía"**
- AppShell visible en todas las rutas protegidas
- Páginas placeholder con contenido
- Loading states apropiados

✅ **AppShell visible en todas las rutas protegidas**
- Topbar con nombre, rol y estado WS
- Navegación según rol
- Banner de reconexión cuando aplica

✅ **No se agregaron dependencias**
- Solo CSS Modules
- Sin librerías externas

✅ **No se tocó lógica de auth ni realtime**
- Solo cambios visuales
- Lógica intacta

## Comparación Antes/Después

### Antes
- Login con estilos inline básicos
- Colores claros (fondo blanco)
- Sin identidad visual
- Componentes con colores para tema claro

### Después
- Login con Card profesional
- Tema oscuro elegante
- Identidad visual consistente
- Componentes adaptados a tema oscuro
- UX mejorada (loading, errores, atajos de teclado)

## Próximos Pasos

- [ ] Aplicar tema oscuro a Kitchen Board (siguiente paso)
- [ ] Mejorar accesibilidad (ARIA labels)
- [ ] Agregar modo claro/oscuro toggle (opcional futuro)

## Notas Técnicas

- Todos los componentes usan variables CSS para fácil mantenimiento
- CSS Modules para evitar conflictos de nombres
- Sin dependencias pesadas
- Código limpio y mantenible
