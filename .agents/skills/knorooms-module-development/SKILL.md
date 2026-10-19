---
name: knorooms-module-development
description: Guía paso a paso para desarrollar o evolucionar un módulo de dominio (Students, Academic, Enrollments, Attendance, Grading, ReportCards, etc.) como vertical slice en KNOROOMS.
---

# Skill: Desarrollo de Módulos y Vertical Slices (`knorooms-module-development`)

## 1. Propósito
Guiar la implementación completa de nuevas funcionalidades (vertical slices) en cualquiera de los módulos de negocio de KNOROOMS (`Students`, `Academic`, `Enrollments`, `Attendance`, `Grading`, `ReportCards`, etc.), desde el modelo de dominio y políticas RLS hasta el endpoint HTTP, pruebas de aislamiento y vista en Next.js.

## 2. Cuándo debe activarse
- Al implementar casos de uso en los módulos académicos preparados en `backend/src/Knorooms.Modules/Modules/`.
- Al añadir nuevas entidades, contratos, servicios de aplicación o endpoints institucionales.

## 3. Cuándo no debe activarse
- Para ajustes de infraestructura pura de Docker o CI/CD que no tocan módulos de negocio.

## 4. Archivos y directorios relevantes
- `backend/src/Knorooms.Modules/Modules/<Modulo>/Domain/` — Entidades de dominio e invariantes.
- `backend/src/Knorooms.Modules/Modules/<Modulo>/Contracts/` — DTOs (`record`), interfaces de servicio y eventos de dominio (`IDomainEvent`).
- `backend/src/Knorooms.Modules/Modules/<Modulo>/Application/` — Implementación de casos de uso.
- `backend/src/Knorooms.Modules/Common/Persistence/Configurations/` — Configuraciones `IEntityTypeConfiguration<T>`.
- `backend/src/Knorooms.Modules/ModulesDependencyInjection.cs` — Registro de servicios en DI.
- `backend/src/Knorooms.SharedKernel/Authorization/PermissionCatalog.cs` — Permisos atómicos del módulo.

## 5. Reglas obligatorias
1. **Respetar la estructura interna del módulo**:
   - `Domain/`: entidades con constructores privados para EF Core, métodos de fábrica o constructores con validación de invariantes (`ArgumentException`) y propiedades con `private set`.
   - `Contracts/`: interfaces públicas (`IMyModuleService`), DTOs de entrada/salida y eventos `IDomainEvent`.
   - `Application/`: implementación `internal sealed class` registrada por su interfaz en `ModulesDependencyInjection.cs`.
2. **Validar contexto institucional**: todo servicio que opere sobre datos de un colegio debe verificar que `tenantContextAccessor.Current.ExecutionMode == DatabaseExecutionMode.Tenant` y que `TenantId` tenga valor.
3. **Permisos explícitos**: usar o agregar permisos en `PermissionCatalog` (`students.read`, `students.write`, `enrollments.write`, `attendance.write`, `grading.write`, `reportcards.publish`, etc.).
4. **Auditoría**: registrar en `dbContext.AuditLogs` las operaciones críticas (matriculación, cambio de calificaciones publicadas, emisión de boletines).

## 6. Patrones permitidos
- Consultas directas sobre `ApplicationDbContext` dentro de la capa `Application` del módulo propietario (sin crear repositorios genéricos intermedios).
- Uso de `Result<T>` para comunicar errores de negocio (`Error.Conflict`, `Error.NotFound`, `Error.Validation`) sin lanzar excepciones para control de flujo esperado.

## 7. Antipatrones prohibidos
- Modificar directamente colecciones o propiedades de entidades de otro módulo sin pasar por su contrato o servicio propietario.
- Crear clases de servicio públicas (`public class`) en `Application/` que permitan a otros módulos acoplarse a la implementación en lugar de la interfaz en `Contracts/`.

## 8. Flujo recomendado paso a paso
1. **Permisos**: verificar que el permiso necesario exista en `PermissionCatalog.cs` y esté asignado al rol institucional correspondiente (`InstitutionAdmin`, `AcademicCoordinator`, `Teacher`, etc.).
2. **Dominio y Persistencia**: revisar o ampliar la entidad en `Modules/<Modulo>/Domain/`, su `IEntityTypeConfiguration<T>`, su `DbSet` en `ApplicationDbContext` y su inclusión en `PostgresRlsPolicySql.TenantScopedTables`.
3. **Contrato y Aplicación**: definir DTOs e interfaz en `Modules/<Modulo>/Contracts/`, implementar el servicio en `Modules/<Modulo>/Application/` y registrarlo en `ModulesDependencyInjection.cs`.
4. **API y Validación**: añadir el validador `FluentValidation` y la acción del Controller en `Knorooms.Api`.
5. **Pruebas**: escribir pruebas unitarias de dominio, verificar `ModularArchitectureTests` y añadir una prueba de integración multi-tenant con `colegio-a` y `colegio-b`.
6. **Frontend (si aplica)**: exponer la funcionalidad en `apps/web/src/features/school/` a través del BFF.

## 9. Checklist de verificación
- [ ] ¿La implementación en `Application/` es `internal sealed` y expone solo su interfaz en `Contracts/`?
- [ ] ¿Se verificó el aislamiento entre `colegio-a` y `colegio-b` con pruebas de integración?
- [ ] ¿Se actualizó `docs/architecture/api-contract.md` con los nuevos endpoints?

## 10. Comandos reales del repositorio
```powershell
dotnet test backend/Knorooms.slnx
```
