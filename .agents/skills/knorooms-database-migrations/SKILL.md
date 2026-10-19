---
name: knorooms-database-migrations
description: Gestión de migraciones centralizadas de Entity Framework Core y políticas SQL de Row-Level Security (RLS) en PostgreSQL para KNOROOMS.
---

# Skill: Migraciones de Base de Datos y Políticas RLS (`knorooms-database-migrations`)

## 1. Propósito
Establecer el procedimiento seguro, versionado y auditable para generar, revisar y aplicar migraciones de esquema en PostgreSQL dentro de KNOROOMS, garantizando que toda nueva tabla institucional nazca con sus políticas Row-Level Security (`ENABLE` + `FORCE ROW LEVEL SECURITY`) y claves foráneas compuestas.

## 2. Cuándo debe activarse
- Al añadir o modificar entidades, propiedades, índices o relaciones en `Knorooms.Modules`.
- Al crear una nueva migración con `dotnet ef migrations add`.
- Al aplicar migraciones en el entorno local o en pipelines de despliegue.

## 3. Cuándo no debe activarse
- Cuando los cambios son exclusivamente de lógica en memoria, DTOs o interfaz de usuario sin impacto en el modelo de EF Core.

## 4. Archivos y directorios relevantes
- `backend/src/Knorooms.Modules/Common/Persistence/ApplicationDbContext.cs` — Modelo unificado de EF Core.
- `backend/src/Knorooms.Modules/Common/Persistence/ApplicationDbContextFactory.cs` — Fábrica de tiempo de diseño (`IDesignTimeDbContextFactory<ApplicationDbContext>`).
- `backend/src/Knorooms.Modules/Common/Persistence/PostgresRlsPolicySql.cs` — Generador centralizado de sentencias SQL para políticas RLS.
- `backend/src/Knorooms.Modules/Common/Persistence/Migrations/` — Historial de migraciones versionadas.
- `infrastructure/docker/postgres/init/01-init-roles.sql` — Creación e inicialización de los roles `knorooms_migrator` y `knorooms_app`.

## 5. Reglas obligatorias
1. **Separación de roles de base de datos**:
   - **Migraciones (`DDL`)**: se ejecutan con `knorooms_migrator` (propietario de las tablas y políticas RLS).
   - **Ejecución de la aplicación (`DML`)**: se ejecuta con `knorooms_app` (`NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS`).
2. **Ninguna tabla institucional sin RLS**: si una migración crea una nueva tabla con `tenant_id`, esa misma migración **debe** habilitar y forzar RLS sobre dicha tabla (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY; ALTER TABLE ... FORCE ROW LEVEL SECURITY; CREATE POLICY ...`) e incluir el nombre de la tabla en `PostgresRlsPolicySql.TenantScopedTables`.
3. **Prohibido editar migraciones ya fusionadas en `main`**: cualquier cambio posterior requiere una nueva migración incremental.
4. **Prohibido generar migraciones vacías** o usar `EnsureCreated()`.

## 6. Patrones permitidos
- Invocar `PostgresRlsPolicySql.BuildApplyPoliciesSql()` (o el SQL específico de la nueva tabla) dentro del método `Up(MigrationBuilder migrationBuilder)` de la migración generada.
- Revisar siempre el archivo `.cs` generado por `dotnet ef migrations add` antes de hacer commit para verificar tipos de columna, índices y cascadas.

## 7. Antipatrones prohibidos
- Otorgar `SUPERUSER` o `BYPASSRLS` al usuario `knorooms_app`.
- Dejar `onDelete: ReferentialAction.Cascade` en relaciones entre entidades académicas históricas donde el borrado accidental destruiría expedientes escolares.

## 8. Flujo recomendado paso a paso
1. Realizar los cambios en la entidad y su `IEntityTypeConfiguration<T>`.
2. Si se añadió una nueva tabla institucional, registrarla en `PostgresRlsPolicySql.TenantScopedTables`.
3. Generar la migración desde `backend/`:
   ```powershell
   dotnet ef migrations add <NombreDescriptivoEnIngles> --project src/Knorooms.Modules/Knorooms.Modules.csproj --startup-project src/Knorooms.Api/Knorooms.Api.csproj --output-dir Common/Persistence/Migrations
   ```
4. Inspeccionar la migración generada y añadir en `Up` / `Down` la aplicación/reversión de políticas RLS si incluye nuevas tablas institucionales.
5. Ejecutar `Knorooms.IntegrationTests` para verificar que la migración aplica limpiamente sobre PostgreSQL 17 desde cero y que las políticas RLS funcionan con `knorooms_app`.

## 9. Checklist de verificación
- [ ] ¿La migración contiene cambios reales y no está vacía?
- [ ] ¿Toda nueva tabla institucional tiene `ENABLE` y `FORCE ROW LEVEL SECURITY` en la migración y en `PostgresRlsPolicySql.TenantScopedTables`?
- [ ] ¿Se probó la migración ejecutando `Knorooms.IntegrationTests`?

## 10. Comandos reales del repositorio
```powershell
dotnet ef migrations list --project backend/src/Knorooms.Modules/Knorooms.Modules.csproj --startup-project backend/src/Knorooms.Api/Knorooms.Api.csproj
dotnet ef database update --project backend/src/Knorooms.Modules/Knorooms.Modules.csproj --startup-project backend/src/Knorooms.Api/Knorooms.Api.csproj --connection "Host=localhost;Port=5432;Database=knorooms;Username=knorooms_migrator;Password=knorooms_local_dev_migrator"
```
