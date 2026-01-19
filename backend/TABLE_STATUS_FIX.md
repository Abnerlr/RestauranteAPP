# Fix: Table Status en Respuestas de TableSessions

## Problema Resuelto

Los métodos `requestCheckout` y `closeSession` (y verificado `openSession`) ahora aseguran que el `table.status` en la respuesta siempre refleje el estado **REAL** de la base de datos después de la transacción.

## Cambios Realizados

### 1. `openSession` ✅
- Ya estaba correcto: usa `updatedTable` que es el resultado directo del `tx.table.update()`
- El estado de la mesa se actualiza antes de crear la sesión y se retorna correctamente

### 2. `requestCheckout` ✅
**Antes:** El `include: { table: true }` se hacía antes de actualizar la mesa, causando que el estado fuera desactualizado.

**Ahora:**
- Actualiza la sesión a `CHECKOUT`
- Actualiza la mesa a `CHECKOUT` y captura el resultado
- Retorna el estado actualizado de la mesa

### 3. `closeSession` ✅
**Antes:** El `include: { table: true }` se hacía antes de actualizar la mesa, causando que el estado fuera desactualizado.

**Ahora:**
- Actualiza la sesión a `CLOSED`
- Actualiza la mesa a `AVAILABLE` y captura el resultado
- Retorna el estado actualizado de la mesa

## Archivos Modificados

- `backend/src/modules/table-sessions/table-sessions.service.ts`

## Verificación de Compilación

```bash
cd backend
pnpm build
```

## Comandos para Probar el Flujo

### Prerequisitos
1. Tener el backend corriendo: `pnpm dev`
2. Tener una base de datos configurada y migrada
3. Tener al menos un restaurante y usuarios creados

### Flujo Completo de Prueba

```bash
# Variables de entorno (ajusta según tu setup)
BASE_URL="http://localhost:3000"

# 1. Login como ADMIN para crear mesa
echo "=== 1. Login como ADMIN ==="
ADMIN_TOKEN=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@restaurante.com","password":"password123"}' \
  | jq -r '.accessToken')
echo "Token: ${ADMIN_TOKEN:0:20}..."

# 2. Crear mesa
echo -e "\n=== 2. Crear mesa ==="
TABLE_RESPONSE=$(curl -s -X POST $BASE_URL/api/v1/tables \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"number": 1, "area": "Sala Principal"}')
TABLE_ID=$(echo $TABLE_RESPONSE | jq -r '.id')
echo "Mesa creada - ID: $TABLE_ID"
echo "Estado inicial: $(echo $TABLE_RESPONSE | jq -r '.status')"
echo "Respuesta completa:"
echo $TABLE_RESPONSE | jq

# 3. Login como WAITER
echo -e "\n=== 3. Login como WAITER ==="
WAITER_TOKEN=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"waiter@restaurante.com","password":"password123"}' \
  | jq -r '.accessToken')
echo "Token: ${WAITER_TOKEN:0:20}..."

# 4. Abrir sesión (openSession)
echo -e "\n=== 4. Abrir sesión (openSession) ==="
OPEN_RESPONSE=$(curl -s -X POST $BASE_URL/api/v1/table-sessions/open \
  -H "Authorization: Bearer $WAITER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tableId\": \"$TABLE_ID\"}")
SESSION_ID=$(echo $OPEN_RESPONSE | jq -r '.id')
TABLE_STATUS_AFTER_OPEN=$(echo $OPEN_RESPONSE | jq -r '.table.status')
echo "Sesión abierta - ID: $SESSION_ID"
echo "Estado de mesa después de abrir: $TABLE_STATUS_AFTER_OPEN"
echo "✅ Debe ser: OCCUPIED"
echo "Respuesta completa:"
echo $OPEN_RESPONSE | jq

# 5. Solicitar checkout (requestCheckout)
echo -e "\n=== 5. Solicitar checkout (requestCheckout) ==="
CHECKOUT_RESPONSE=$(curl -s -X POST $BASE_URL/api/v1/table-sessions/request-checkout \
  -H "Authorization: Bearer $WAITER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\"}")
TABLE_STATUS_AFTER_CHECKOUT=$(echo $CHECKOUT_RESPONSE | jq -r '.table.status')
echo "Checkout solicitado"
echo "Estado de mesa después de checkout: $TABLE_STATUS_AFTER_CHECKOUT"
echo "✅ Debe ser: CHECKOUT"
echo "Respuesta completa:"
echo $CHECKOUT_RESPONSE | jq

# 6. Login como CASHIER
echo -e "\n=== 6. Login como CASHIER ==="
CASHIER_TOKEN=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cashier@restaurante.com","password":"password123"}' \
  | jq -r '.accessToken')
echo "Token: ${CASHIER_TOKEN:0:20}..."

# 7. Cerrar sesión (closeSession)
echo -e "\n=== 7. Cerrar sesión (closeSession) ==="
CLOSE_RESPONSE=$(curl -s -X POST $BASE_URL/api/v1/table-sessions/close \
  -H "Authorization: Bearer $CASHIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\"}")
TABLE_STATUS_AFTER_CLOSE=$(echo $CLOSE_RESPONSE | jq -r '.table.status')
echo "Sesión cerrada"
echo "Estado de mesa después de cerrar: $TABLE_STATUS_AFTER_CLOSE"
echo "✅ Debe ser: AVAILABLE"
echo "Respuesta completa:"
echo $CLOSE_RESPONSE | jq

# 8. Verificar estado final en DB (opcional, requiere acceso directo a DB)
echo -e "\n=== 8. Resumen ==="
echo "Estado inicial: AVAILABLE"
echo "Después de openSession: $TABLE_STATUS_AFTER_OPEN (debe ser OCCUPIED)"
echo "Después de requestCheckout: $TABLE_STATUS_AFTER_CHECKOUT (debe ser CHECKOUT)"
echo "Después de closeSession: $TABLE_STATUS_AFTER_CLOSE (debe ser AVAILABLE)"
```

### Script de Prueba Simplificado (Windows PowerShell)

```powershell
# Configurar variables
$baseUrl = "http://localhost:3000"

# 1. Login ADMIN
$adminLogin = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"admin@restaurante.com","password":"password123"}'
$adminToken = $adminLogin.accessToken
Write-Host "Admin token obtenido"

# 2. Crear mesa
$tableBody = @{
  number = 1
  area = "Sala Principal"
} | ConvertTo-Json
$table = Invoke-RestMethod -Uri "$baseUrl/api/v1/tables" `
  -Method POST -Headers @{Authorization = "Bearer $adminToken"} `
  -ContentType "application/json" -Body $tableBody
$tableId = $table.id
Write-Host "Mesa creada - Estado inicial: $($table.status)"

# 3. Login WAITER
$waiterLogin = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"waiter@restaurante.com","password":"password123"}'
$waiterToken = $waiterLogin.accessToken
Write-Host "Waiter token obtenido"

# 4. Abrir sesión
$openBody = @{tableId = $tableId} | ConvertTo-Json
$openResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/table-sessions/open" `
  -Method POST -Headers @{Authorization = "Bearer $waiterToken"} `
  -ContentType "application/json" -Body $openBody
$sessionId = $openResponse.id
Write-Host "Sesión abierta - Estado mesa: $($openResponse.table.status) (debe ser OCCUPIED)"

# 5. Solicitar checkout
$checkoutBody = @{sessionId = $sessionId} | ConvertTo-Json
$checkoutResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/table-sessions/request-checkout" `
  -Method POST -Headers @{Authorization = "Bearer $waiterToken"} `
  -ContentType "application/json" -Body $checkoutBody
Write-Host "Checkout solicitado - Estado mesa: $($checkoutResponse.table.status) (debe ser CHECKOUT)"

# 6. Login CASHIER
$cashierLogin = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"cashier@restaurante.com","password":"password123"}'
$cashierToken = $cashierLogin.accessToken
Write-Host "Cashier token obtenido"

# 7. Cerrar sesión
$closeBody = @{sessionId = $sessionId} | ConvertTo-Json
$closeResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/table-sessions/close" `
  -Method POST -Headers @{Authorization = "Bearer $cashierToken"} `
  -ContentType "application/json" -Body $closeBody
Write-Host "Sesión cerrada - Estado mesa: $($closeResponse.table.status) (debe ser AVAILABLE)"

# Resumen
Write-Host "`n=== RESUMEN ===" -ForegroundColor Green
Write-Host "Estado inicial: AVAILABLE"
Write-Host "Después de openSession: $($openResponse.table.status) (esperado: OCCUPIED)"
Write-Host "Después de requestCheckout: $($checkoutResponse.table.status) (esperado: CHECKOUT)"
Write-Host "Después de closeSession: $($closeResponse.table.status) (esperado: AVAILABLE)"
```

## Validación Manual

Para verificar que el estado es correcto, puedes:

1. **Ejecutar el flujo completo** usando los scripts arriba
2. **Verificar en la base de datos** directamente:
   ```sql
   SELECT id, number, status FROM tables WHERE id = '<TABLE_ID>';
   ```
3. **Comparar** el `table.status` en la respuesta con el estado real en la DB

## Resultado Esperado

Después de cada operación, el `table.status` en la respuesta debe coincidir exactamente con el estado en la base de datos:

- **openSession**: `table.status` = `OCCUPIED` (si la mesa estaba `AVAILABLE`)
- **requestCheckout**: `table.status` = `CHECKOUT`
- **closeSession**: `table.status` = `AVAILABLE`

## Notas Técnicas

- Todas las operaciones son **atómicas** (dentro de `$transaction`)
- El estado de la mesa se actualiza **antes** de construir la respuesta
- Se usa el resultado directo del `tx.table.update()` para garantizar consistencia
- No hay `include` que pueda traer datos desactualizados
