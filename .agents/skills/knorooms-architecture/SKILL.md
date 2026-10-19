---
name: knorooms-architecture
description: Guía de arquitectura del monolito modular KNOROOMS, límites entre módulos, contratos síncronos, eventos de dominio y Transactional Outbox. Úsala al diseñar nuevos módulos, evaluar dependencias cruzadas o tomar decisiones arquitectónicas (ADRs).
---

# Skill: Arquitectura del Monolito Modular KNOROOMS (`knorooms-architecture`)

## 1. Propósito
Garantizar que cualquier evolución del sistema KNOROOMS preserve la arquitectura de **monolito modular**, la separación estricta de responsabilidades entre módulos de dominio, la comunicación híbrida (contratos síncronos + eventos con Transactional Outbox) y la prohibición de referencias directas a implementaciones o entidades internas de otros módulos.

## 2. Cuándo debe activarse
- Al diseñar o añadir un nuevo módulo de dominio o un nuevo caso de uso que involucre más de un módulo.
- Al definir contratos públicos (`Contracts`), eventos de dominio (`IDomainEvent`) o integraciones en el `OutboxProcessorHostedService`.
- Al evaluar si una dependencia entre módulos viola las reglas de arquitectura verificadas por `NetArchTest`.
- Al redactar o actualizar un Architecture Decision Record (ADR) en `docs/decisions/`.

## 3. Cuándo no debe activarse
- Para ajustes puramente visuales o de estilos CSS en `apps/web/` que no cambian contratos ni límites de datos.
- Para correcciones tipográficas en documentación no arquitectónica.

## 4. Archivos y directorios relevantes
- `backend/src/Knorooms.SharedKernel/` — Primitivas compartidas (`Entity`, `TenantEntity`, `Result<T>`, `ITenantContextAccessor`, `PermissionCatalog`).
- `backend/src/Knorooms.Modules/Modules/<Modulo>/` — Módulos del sistema (`Domain`, `Contracts`, `Application`, `Infrastructure`).
- `backend/src/Knorooms.Modules/Common/Persistence/ApplicationDbContext.cs` — Único `DbContext` compartido y registro de `OutboxMessage`.
- `backend/tests/Knorooms.UnitTests/Architecture/ModularArchitectureTests.cs` — Suite automatizada `NetArchTest` que valida límites modulares.
- `docs/architecture/` y `docs/decisions/` — Documentación viva y ADRs.

## 5. Reglas obligatorias
1. **Un solo proyecto de módulos (`Knorooms.Modules`)**: no crear un `.csproj` por cada módulo de negocio.
2. **Aislamiento entre módulos**: el módulo `A` solo puede depender de `Knorooms.SharedKernel` y del namespace `Knorooms.Modules.Modules.<ModuloB>.Contracts`. Nunca debe referenciar `Domain`, `Application` ni `Infrastructure` de `<ModuloB>`.
3. **Sin sobreingeniería**: no introducir MediatR, AutoMapper, repositorios genéricos (`IRepository<T>`) ni buses distribuidos (RabbitMQ/Kafka) sin un ADR previo aprobado.
4. **Eventos confiables vía Transactional Outbox**: ningún efecto secundario externo debe dispararse antes de confirmar la transacción en PostgreSQL; los eventos `IDomainEvent` agregados a entidades de dominio se serializan automáticamente en `outbox_messages` dentro de `ApplicationDbContext.SaveChangesAsync`.

## 6. Patrones permitidos
- **Comunicación síncrona**: inyectar una interfaz de `Contracts` de otro módulo (ej. `ITenantLookupService`, `ITenantAuthorizationService`) para lecturas o validaciones inmediatas.
- **Comunicación asíncrona desacoplada**: llamar `RaiseDomainEvent(new MiEventoDomainEvent(...))` en la entidad raíz antes de `SaveChangesAsync`.
- **Retorno de operaciones de negocio**: utilizar `Result` y `Result<T>` con códigos `Error` tipados (`ErrorType.Validation`, `ErrorType.Conflict`, `ErrorType.NotFound`, `ErrorType.Forbidden`).

## 7. Antipatrones prohibidos
- Referenciar entidades de EF Core de otro módulo directamente en propiedades de navegación cruzadas no autorizadas o exponerlas en Controllers.
- Hacer consultas directas a tablas de otro módulo omitiendo sus contratos cuando exista invariante de negocio.
- Publicar mensajes a servicios externos (correo, webhooks) en mitad de un método de servicio antes de `await dbContext.SaveChangesAsync(cancellationToken)`.

## 8. Flujo recomendado paso a paso
1. Identificar el módulo propietario del dato y de la invariante de negocio.
2. Si otro módulo necesita consultar o validar información síncronamente, definir un DTO inmutable (`record`) y una interfaz en `Modules/<Modulo>/Contracts/`.
3. Si otros módulos deben reaccionar a un cambio de estado, definir un `record` que implemente `IDomainEvent` y registrarlo con `RaiseDomainEvent(...)`.
4. Implementar el servicio en `Modules/<Modulo>/Application/` devolviendo `Result<T>`.
5. Ejecutar las pruebas de arquitectura (`ModularArchitectureTests`) para confirmar que no se introdujeron acoplamientos prohibidos.

## 9. Checklist de verificación
- [ ] ¿Se mantuvo la estructura dentro de `Knorooms.Modules` sin crear proyectos `.csproj` adicionales?
- [ ] ¿Las referencias entre módulos apuntan únicamente a `.Contracts` o `Knorooms.SharedKernel`?
- [ ] ¿Los eventos de dominio pasan por el Transactional Outbox (`outbox_messages`)?
- [ ] ¿Pasan todas las pruebas de `ModularArchitectureTests`?

## 10. Comandos reales del repositorio
```powershell
dotnet test backend/tests/Knorooms.UnitTests/Knorooms.UnitTests.csproj --filter "FullyQualifiedName~ModularArchitectureTests"
```
