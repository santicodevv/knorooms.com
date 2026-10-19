---
name: knorooms-testing
description: Estrategia y ejecución de pruebas automatizadas en KNOROOMS: pruebas unitarias y de arquitectura (xUnit + NetArchTest), pruebas de integración reales con PostgreSQL 17 (Testcontainers) y pruebas de frontend/BFF (Vitest).
---

# Skill: Pruebas Automatizadas Unitarias y de Integración (`knorooms-testing`)

## 1. Propósito
Garantizar que cada cambio en KNOROOMS esté respaldado por pruebas automatizadas reales y reproducibles, incluyendo pruebas de arquitectura modular, pruebas de integración contra **PostgreSQL 17 real** verificando políticas RLS con dos o más instituciones, y pruebas unitarias del BFF en Next.js.

## 2. Cuándo debe activarse
- Al escribir nuevas funcionalidades o corregir errores en `backend/` o `apps/web/`.
- Al añadir nuevas tablas institucionales, endpoints HTTP o reglas de seguridad/tenancy.
- Antes de dar por completada cualquier tarea o abrir un Pull Request.

## 3. Cuándo no debe activarse
- Nunca debe omitirse cuando se modifica código ejecutable.

## 4. Archivos y directorios relevantes
- `backend/tests/Knorooms.UnitTests/` — Pruebas unitarias de dominio, `HostSubdomainParserTests`, `PermissionCatalogTests` y `ModularArchitectureTests` (`NetArchTest`).
- `backend/tests/Knorooms.IntegrationTests/Infrastructure/PostgresIntegrationFixture.cs` — Fixture que levanta `postgres:17-alpine` con Testcontainers, crea el rol no-superuser `knorooms_app` (`NOBYPASSRLS`) y aplica migraciones reales.
- `backend/tests/Knorooms.IntegrationTests/Infrastructure/TestApiFactory.cs` — `WebApplicationFactory<Program>` conectada al contenedor PostgreSQL usando `knorooms_app` y `TestOidcAuthHandler`.
- `backend/tests/Knorooms.IntegrationTests/MultiTenancy/PostgresRlsIsolationTests.cs` — Pruebas de aislamiento RLS y claves foráneas compuestas entre tenants.
- `backend/tests/Knorooms.IntegrationTests/Api/FoundationalVerticalSlicesIntegrationTests.cs` — Pruebas HTTP extremo a extremo de onboarding, aislamiento por subdominio, soporte temporal, revocación y MFA.
- `apps/web/src/**/__tests__/*.test.ts` — Pruebas Vitest de resolución de host, cifrado AES-256-GCM, CSRF, políticas de sesión y `returnTo`.

## 5. Reglas obligatorias
1. **Prohibido usar bases en memoria para probar aislamiento multi-tenant**: `EF Core InMemory` y `SQLite` no ejecutan políticas RLS de PostgreSQL ni claves foráneas compuestas con el mismo comportamiento. Toda prueba de aislamiento debe ejecutarse en `Knorooms.IntegrationTests` contra PostgreSQL real.
2. **Prohibido ejecutar pruebas de aplicación con el superusuario de PostgreSQL**: `PostgresIntegrationFixture` aplica migraciones con `knorooms_migrator` y expone `AppRoleConnectionString` (`Username=knorooms_app`, `NOBYPASSRLS`) para las pruebas.
3. **Al menos dos tenants en pruebas de aislamiento**: siempre sembrar datos en `Tenant A` y `Tenant B` y demostrar que:
   - `Tenant A` solo lee filas de `Tenant A` (incluso forzando `.IgnoreQueryFilters()`).
   - `Tenant A` recibe error `42501` de PostgreSQL si intenta insertar o actualizar una fila con `TenantId = Tenant B`.
   - En modo `Platform`, las tablas institucionales devuelven 0 filas.

## 6. Patrones permitidos
- Uso de `TestOidcAuthHandler` en pruebas de integración HTTP mediante cabeceras `X-Test-Oidc-Sub`, `X-Test-Oidc-Email`, `X-Test-Oidc-Roles` y `X-Test-Oidc-Amr` para simular tokens OIDC validados con distintos claims sin depender de un servidor OIDC externo durante el test.
- Pruebas puras y deterministas en Vitest inyectando `now` en las funciones de expiración de sesión (`evaluateSessionValidity`).

## 7. Antipatrones prohibidos
- Marcar pruebas fallidas con `[Fact(Skip = "...")]` para hacer pasar el pipeline de CI.
- Afirmar que las pruebas pasan sin haber ejecutado realmente los comandos y verificado el código de salida `0`.

## 8. Flujo recomendado paso a paso
1. Ejecutar primero las pruebas rápidas (`Knorooms.UnitTests` y `pnpm --dir apps/web test`).
2. Asegurar que Docker Desktop / daemon esté activo y ejecutar `Knorooms.IntegrationTests`.
3. Si se añadió un nuevo módulo o tabla institucional, extender `PostgresRlsIsolationTests` y `FoundationalVerticalSlicesIntegrationTests`.

## 9. Checklist de verificación
- [ ] ¿Pasan todas las pruebas de `Knorooms.UnitTests`?
- [ ] ¿Pasan todas las pruebas de `Knorooms.IntegrationTests` en contenedor PostgreSQL 17 real?
- [ ] ¿Pasan todas las pruebas de `Vitest` en `apps/web`?

## 10. Comandos reales del repositorio
```powershell
dotnet test backend/Knorooms.slnx --logger "console;verbosity=normal"
pnpm --dir apps/web test
```
