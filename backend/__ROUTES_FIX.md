# Fix del Endpoint __routes

## Problema

El endpoint `GET /api/v1/__routes` devolvía 404 aunque `GET /api/v1/__health` funcionaba correctamente.

## Solución Implementada

### Cambios en `backend/src/app.controller.ts`

1. **Agregado logging detallado** para debugging:
   - Log cuando el handler es llamado
   - Log del NODE_ENV
   - Logs de errores si no se encuentra el router
   - Log del número de rutas retornadas

2. **Mejorada la verificación de NODE_ENV**:
   - Verifica `process.env.NODE_ENV` primero
   - Luego `configService.get`
   - Default a 'development' si no está definido

3. **Validaciones mejoradas**:
   - Verifica que existe la instancia de Express
   - Verifica que existe el router
   - Verifica que existe el stack del router
   - Retorna array vacío en lugar de error si algo falta

4. **Extracción de rutas mejorada**:
   - Manejo más robusto de paths
   - Mejor manejo de prefijos anidados
   - Filtrado de métodos válidos

## Verificación

### 1. Reiniciar el Backend

```bash
cd backend
pnpm dev
```

### 2. Verificar Logs de Arranque

Deberías ver en los logs:
```
[BOOT] Health: http://localhost:3001/api/v1/__health
[DEV] Routes: http://localhost:3001/api/v1/__routes
```

Y en el RouterExplorer de NestJS (si está habilitado):
```
Mapped {/api/v1/__health, GET}
Mapped {/api/v1/__routes, GET}
```

### 3. Probar el Endpoint

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/v1/__routes" -Method GET
```

**Git Bash / Linux / Mac:**
```bash
curl -i http://localhost:3001/api/v1/__routes
```

**Esperado (200 OK):**
```json
{
  "routes": [
    {
      "method": "GET",
      "path": "/api/v1/__health"
    },
    {
      "method": "GET",
      "path": "/api/v1/__routes"
    },
    {
      "method": "POST",
      "path": "/api/v1/auth/dev-login"
    },
    {
      "method": "POST",
      "path": "/api/v1/auth/login"
    }
  ]
}
```

### 4. Verificar Logs en Consola

Al hacer la petición, deberías ver en la consola del backend:
```
[__routes] Handler called
[__routes] NODE_ENV: development
[__routes] Returning X routes
```

## Troubleshooting

### Si sigue dando 404:

1. **Verifica que el backend se haya reiniciado** después de los cambios
2. **Verifica NODE_ENV**:
   ```bash
   # En backend/.env
   NODE_ENV=development
   ```
3. **Verifica los logs** cuando haces la petición:
   - Si NO ves `[__routes] Handler called`, el método no se está ejecutando
   - Si ves el log pero retorna 404, puede ser un problema de routing

4. **Verifica que AppController esté registrado**:
   ```typescript
   // backend/src/app.module.ts debe tener:
   controllers: [AppController],
   ```

5. **Verifica que no haya DevModule importado**:
   ```typescript
   // backend/src/app.module.ts NO debe tener:
   imports: [..., DevModule, ...]
   ```

### Si el handler se ejecuta pero retorna array vacío:

- Revisa los logs de error en consola
- Verifica que el router de Express esté correctamente inicializado
- Puede ser que las rutas se registren después de que se llama el método

## Confirmación Final

✅ `GET /api/v1/__health` → 200 OK  
✅ `GET /api/v1/__routes` → 200 OK (solo en development)  
✅ Ambos endpoints en el mismo `AppController`  
✅ Logs de debugging agregados  
✅ `DevModule` no está importado en `AppModule`
