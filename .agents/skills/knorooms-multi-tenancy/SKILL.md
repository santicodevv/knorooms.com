---
name: knorooms-multi-tenancy
description: Arquitectura y reglas críticas de aislamiento multi-tenant de KNOROOMS: resolución por subdominio, membresía obligatoria, PostgreSQL Row-Level Security (RLS), PostgresRlsInterceptor y prevención de fugas entre colegios.
---

# Skill: Aislamiento Multi-Tenant y PostgreSQL RLS (`knorooms-multi-tenancy`)

## 1. Propósito
Proteger la invariante más crítica de KNOROOMS: **ningún usuario, consulta, escritura ni clave foránea de una institución puede leer, modificar o referenciar datos de otra institución**, combinando resolución estricta por subdominio, validación de membresía, filtros globales de EF Core y **Row-Level Security (RLS) forzado en PostgreSQL**.

## 2. Cuándo debe activarse
- Al modificar la resolución de host/subdominio (`HostSubdomainParser`, `TenantAndIdentityResolutionMiddleware` o `apps/web/src/proxy.ts`).
- Al tocar `PostgresRlsInterceptor`, `PostgresRlsPolicySql`, `ITenantContextAccessor` o `ApplicationDbContext`.
- Al crear cualquier tabla institucional nueva o un proceso en segundo plano (`BackgroundService`).
- Al auditar o probar el aislamiento de datos entre colegios.

## 3. Cuándo no debe activarse
- Para cambios de copia o diseño puramente estético en páginas estáticas.

## 4. Archivos y directorios relevantes
- `backend/src/Knorooms.SharedKernel/Tenancy/HostSubdomainParser.cs` — Resolución determinista de host (`Public`, `Platform`, `Institution`, `Invalid`).
- `backend/src/Knorooms.SharedKernel/Tenancy/TenantContext.cs` — `ExecutionScopeContext`, `DatabaseExecutionMode` y `ITenantContextAccessor`.
- `backend/src/Knorooms.Api/Security/TenantAndIdentityResolutionMiddleware.cs` — Middleware que resuelve el tenant por subdominio y establece el contexto de ejecución.
- `backend/src/Knorooms.Modules/Common/Persistence/PostgresRlsInterceptor.cs` — Interceptor de comandos ADO.NET/EF Core que inyecta `set_config('app.current_tenant_id', ...)` y `set_config('app.execution_mode', ...)`.
- `backend/src/Knorooms.Modules/Common/Persistence/PostgresRlsPolicySql.cs` — Definición SQL de políticas RLS (`ENABLE` + `FORCE ROW LEVEL SECURITY`).
- `backend/tests/Knorooms.IntegrationTests/MultiTenancy/PostgresRlsIsolationTests.cs` — Pruebas de integración contra PostgreSQL real con el rol `knorooms_app` (`NOBYPASSRLS`).

## 5. Reglas obligatorias
1. **El subdominio identifica el tenant solicitado, pero NO autoriza al usuario**: toda petición a `<slug>.knorooms.com` debe verificar membresía activa en `tenant_memberships` o una sesión de soporte temporal aprobada y vigente en `support_access_requests`.
2. **El cliente jamás elige `TenantId`**: ningún DTO de request en rutas `/api/tenant/*` debe aceptar `TenantId` desde el body, query string o cabeceras arbitrarias; siempre se toma de `ITenantContextAccessor.Current.TenantId`.
3. **Rol de base de datos sin bypass de RLS**: la aplicación se conecta como `knorooms_app` (`NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS`).
4. **Toda tabla institucional debe tener `ENABLE` y `FORCE ROW LEVEL SECURITY`**: con cláusulas `USING` (lectura/actualización/borrado) y `WITH CHECK` (inserción/actualización) que exijan `app.execution_mode = 'tenant'` y `tenant_id = nullif(current_setting('app.current_tenant_id', true), '')::uuid`.
5. **Sin bypass indiscriminado para administradores globales**: en `app.execution_mode = 'platform'`, las tablas académicas e institucionales devuelven 0 filas por política RLS; la administración global opera sobre tablas de plataforma y accede a un colegio solo mediante el flujo auditado de `SupportAccess`.
6. **Limpieza ante pooling de conexiones**: `PostgresRlsInterceptor` prepende `set_config(..., false)` en cada `DbCommand` ejecutado, garantizando que cualquier conexión reutilizada del pool de Npgsql tenga siempre el contexto exacto del request o job actual.

## 7. Antipatrones prohibidos
- Ejecutar pruebas de integración de aislamiento usando el superusuario `postgres` (que ignora RLS por defecto en PostgreSQL) o usando proveedores en memoria (`InMemory` / `SQLite`).
- Confiar únicamente en `HasQueryFilter` de EF Core sin habilitar RLS en PostgreSQL.
- Usar `.IgnoreQueryFilters()` en servicios de aplicación para consultar datos de múltiples colegios.
- Ejecutar un `BackgroundService` sin abrir explícitamente un `using var scope = tenantContextAccessor.BeginScope(...)`.

## 8. Flujo recomendado paso a paso
1. Determinar si la operación pertenece a contexto `Platform` (`admin.*`) o `Tenant` (`<slug>.*`).
2. Para una nueva tabla institucional:
   - Heredar la entidad de `TenantEntity`.
   - Agregar el nombre de la tabla en `snake_case` a `PostgresRlsPolicySql.TenantScopedTables`.
   - Generar migración de EF Core e incluir la aplicación de la política RLS en `Up`/`Down`.
3. Añadir o ampliar un test en `PostgresRlsIsolationTests` verificando con al menos dos tenants (`colegio-a` y `colegio-b`) que el rol `knorooms_app` no puede leer ni escribir filas cruzadas ni siquiera con `.IgnoreQueryFilters()`.

## 9. Checklist de verificación
- [ ] ¿El `TenantId` proviene exclusivamente de `ITenantContextAccessor.Current`?
- [ ] ¿La tabla institucional está incluida en `PostgresRlsPolicySql.TenantScopedTables` con `ENABLE` y `FORCE ROW LEVEL SECURITY`?
- [ ] ¿Pasan las pruebas de `PostgresRlsIsolationTests` contra PostgreSQL real usando `knorooms_app`?

## 10. Comandos reales del repositorio
```powershell
dotnet test backend/tests/Knorooms.IntegrationTests/Knorooms.IntegrationTests.csproj --filter "FullyQualifiedName~PostgresRlsIsolationTests"
```
