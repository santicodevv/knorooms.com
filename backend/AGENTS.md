# AGENTS.md — Reglas Específicas del Backend (.NET 10)

Consulta primero el archivo raíz [`/AGENTS.md`](../AGENTS.md). Este documento detalla las reglas operativas exclusivas de `backend/`.

## 1. Estructura de Proyectos en `backend/Knorooms.slnx`

- `src/Knorooms.SharedKernel`: primitivas sin dependencias de infraestructura (`Entity`, `TenantScopedEntity`, `IDomainEvent`, `Result<T>`, `Error`, `ITenantContextAccessor`, `HostSubdomainParser`, `PermissionCatalog`).
- `src/Knorooms.Modules`: contiene el `ApplicationDbContext` compartido (`Common/Persistence/`), el interceptor RLS (`PostgresRlsInterceptor`), las migraciones y los 12 módulos en `Modules/<NombreModulo>/`.
- `src/Knorooms.Api`: capa HTTP (configuración OIDC, `TenantAndIdentityResolutionMiddleware`, `PermissionAuthorizationHandler`, validadores FluentValidation y Controllers REST).
- `tests/Knorooms.UnitTests`: pruebas de dominio, parser de host y arquitectura (`NetArchTest`).
- `tests/Knorooms.IntegrationTests`: pruebas contra PostgreSQL 17 real (`Testcontainers.PostgreSql`) bajo el rol `knorooms_app` (`NOBYPASSRLS`).

## 2. Convenciones Obligatorias de C# y EF Core

1. **Encapsulamiento de módulos**:
   - `Knorooms.Modules.Modules.<Modulo>.Contracts` → `public` (DTOs, comandos e interfaces de servicio).
   - `Knorooms.Modules.Modules.<Modulo>.Domain` → entidades con constructores privados y métodos de fábrica que devuelven `Result<T>`.
   - `Knorooms.Modules.Modules.<Modulo>.Application` e `Infrastructure` → siempre `internal`.
2. **Entidades institucionales**:
   - Deben heredar de `TenantScopedEntity` (implementa `ITenantScopedEntity`).
   - En su `IEntityTypeConfiguration<T>`, si pueden ser referenciadas por otras tablas del colegio, deben declarar `builder.HasAlternateKey(x => new { x.TenantId, x.Id })`.
   - Toda relación hacia otra entidad institucional debe usar clave foránea compuesta `HasForeignKey(x => new { x.TenantId, x.ParentId }).HasPrincipalKey(x => new { x.TenantId, x.Id })`.
   - Deben tener su filtro global en `ApplicationDbContext.OnModelCreating` y su tabla registrada en `PostgresRlsPolicySql`.
3. **Controllers delgados**:
   - Nunca inyectar `ApplicationDbContext` en un Controller de negocio.
   - Validar el request con `IValidator<T>` si requiere validación de formato/estructura, delegar al servicio del módulo, y convertir errores con `this.ToProblemResult(result.Error)`.
   - Proteger cada acción con `[Authorize(Policy = PermissionCatalog.<Permiso>)]`.

## 3. Comandos de Verificación

```powershell
cd backend
dotnet build Knorooms.slnx
dotnet test Knorooms.slnx
```
