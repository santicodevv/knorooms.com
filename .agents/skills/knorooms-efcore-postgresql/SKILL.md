---
name: knorooms-efcore-postgresql
description: Reglas de persistencia con Entity Framework Core 10 y PostgreSQL 17 en KNOROOMS: ApplicationDbContext compartido, IEntityTypeConfiguration por módulo, claves foráneas compuestas (tenant_id, id), fechas UTC y concurrencia.
---

# Skill: Persistencia EF Core 10 y PostgreSQL 17 (`knorooms-efcore-postgresql`)

## 1. Propósito
Asegurar un diseño de datos consistente, íntegro y seguro en PostgreSQL mediante el único `ApplicationDbContext` compartido de KNOROOMS, configuraciones Fluent API modulares y restricciones compuestas que impidan la corrupción de datos entre instituciones.

## 2. Cuándo debe activarse
- Al crear o modificar entidades de dominio (`Entity` o `TenantEntity`).
- Al escribir clases `IEntityTypeConfiguration<T>` o índices en PostgreSQL.
- Al definir relaciones (Foreign Keys) entre entidades institucionales.
- Al optimizar consultas de EF Core (`AsNoTracking`, proyecciones `Select`).

## 3. Cuándo no debe activarse
- Para cambios exclusivos en el frontend Next.js o estilos de interfaz.

## 4. Archivos y directorios relevantes
- `backend/src/Knorooms.Modules/Common/Persistence/ApplicationDbContext.cs` — `DbContext` central, filtros globales y despacho de eventos al Outbox.
- `backend/src/Knorooms.Modules/Common/Persistence/Configurations/` — Configuraciones `IEntityTypeConfiguration<T>` de las entidades transversales y académicas.
- `backend/src/Knorooms.SharedKernel/Domain/Entity.cs` — Clases base `Entity`, `AuditableEntity` y `TenantEntity`.

## 5. Reglas obligatorias
1. **Único `ApplicationDbContext`**: todas las entidades de todos los módulos se registran en `ApplicationDbContext` sobre el esquema compartido `public`.
2. **Nombres en `snake_case`**: tablas y columnas en PostgreSQL deben nombrarse explícitamente en `snake_case` dentro de su `IEntityTypeConfiguration<T>`.
3. **UUID (`Guid`) como clave primaria**: generados en la aplicación (`Guid.NewGuid()`) con `ValueGeneratedNever()`.
4. **Claves foráneas compuestas en tablas institucionales**:
   - Toda entidad `TenantEntity` que pueda ser referenciada por otra entidad institucional debe declarar `builder.HasAlternateKey(x => new { x.TenantId, x.Id })`.
   - Toda entidad hija que referencie a otra entidad institucional debe configurar su `HasForeignKey(x => new { x.TenantId, x.<Parent>Id }).HasPrincipalKey(p => new { p.TenantId, p.Id })` con `DeleteBehavior.Restrict`.
5. **Fechas siempre en UTC**: usar `DateTimeOffset` (`timestamptz`) para marcas de tiempo y `DateOnly` (`date`) para fechas de calendario (nacimientos, asistencia, inicio/fin de año escolar).
6. **Restricciones de unicidad por tenant**: toda clave natural de un colegio (matrícula `StudentCode`, nombre de año escolar, código de asignatura) debe ser única por `(TenantId, <Campo>)`, nunca globalmente.

## 6. Patrones permitidos
- Uso de `AsNoTracking()` y proyección directa a DTOs (`.Select(x => new MyDto(...))`) en todas las consultas de lectura.
- Configuración de concurrencia optimista (`IsConcurrencyToken()`) en entidades sujetas a edición concurrente.
- Uso de columnas `jsonb` únicamente para metadatos flexibles o payloads de auditoría/outbox, manteniendo las columnas relacionales tipadas para atributos de negocio.

## 7. Antipatrones prohibidos
- Usar `Database.EnsureCreated()` en lugar de migraciones de EF Core.
- Definir claves foráneas simples (`HasForeignKey(x => x.StudentId)`) entre dos tablas institucionales sin incluir `TenantId` en la relación.
- Usar `DeleteBehavior.Cascade` indiscriminado en historiales académicos, matrículas o calificaciones.
- Dejar entidades sin configuración explícita de longitudes máximas (`HasMaxLength`) o nulabilidad.

## 8. Flujo recomendado paso a paso
1. Heredar la entidad de `TenantEntity` (si pertenece a un colegio) o `AuditableEntity`/`Entity` (si es global).
2. Agregar el `DbSet<T>` en `ApplicationDbContext`.
3. Crear o actualizar la clase `IEntityTypeConfiguration<T>` definiendo tabla, `HasKey`, `HasAlternateKey(x => new { x.TenantId, x.Id })`, propiedades, índices por tenant y claves foráneas compuestas.
4. Si es una `TenantEntity`, añadir también su tabla a `PostgresRlsPolicySql.TenantScopedTables` (ver skill `knorooms-multi-tenancy` y `knorooms-database-migrations`).

## 9. Checklist de verificación
- [ ] ¿La entidad institucional hereda de `TenantEntity`?
- [ ] ¿Tiene `HasAlternateKey(x => new { x.TenantId, x.Id })` y claves foráneas compuestas `(TenantId, <Fk>Id)`?
- [ ] ¿Las restricciones `UNIQUE` incluyen `TenantId` como primera columna?
- [ ] ¿Las lecturas usan `AsNoTracking()`?

## 10. Comandos reales del repositorio
```powershell
dotnet build backend/src/Knorooms.Modules/Knorooms.Modules.csproj
dotnet test backend/tests/Knorooms.IntegrationTests/Knorooms.IntegrationTests.csproj
```
