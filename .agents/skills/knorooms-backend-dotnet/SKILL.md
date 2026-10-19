---
name: knorooms-backend-dotnet
description: Estándares de desarrollo en ASP.NET Core (.NET 10) para KNOROOMS: Controllers delgados, ProblemDetails RFC 9457, FluentValidation, Result pattern, async/await con CancellationToken y logging estructurado.
---

# Skill: Desarrollo Backend en .NET 10 (`knorooms-backend-dotnet`)

## 1. Propósito
Establecer las normas de implementación para la API HTTP (`Knorooms.Api`) y los servicios de aplicación (`Knorooms.Modules`) en .NET 10, asegurando Controllers delgados, respuestas de error estandarizadas (`ProblemDetails`), validación explícita y propagación de `CancellationToken`.

## 2. Cuándo debe activarse
- Al crear o modificar Controllers, middlewares, filtros o políticas en `backend/src/Knorooms.Api/`.
- Al implementar servicios de aplicación, validadores `FluentValidation` o contratos HTTP (DTOs).

## 3. Cuándo no debe activarse
- Para tareas exclusivas del frontend Next.js (`apps/web/`).
- Para análisis puramente de esquema SQL o políticas RLS sin cambios en servicios o endpoints (usar `knorooms-efcore-postgresql` o `knorooms-multi-tenancy`).

## 4. Archivos y directorios relevantes
- `backend/src/Knorooms.Api/Program.cs` — Configuración del host, DI, autenticación OIDC y pipeline HTTP.
- `backend/src/Knorooms.Api/Controllers/` — Controladores HTTP REST (`PlatformController`, `TenantController`, `IdentityController`, `HealthController`).
- `backend/src/Knorooms.Api/Validation/` — Validadores `FluentValidation` para peticiones de entrada.
- `backend/src/Knorooms.Api/Common/ResultProblemDetailsExtensions.cs` — Traducción uniforme de `Result` y `ValidationResult` a `ProblemDetails` (`application/problem+json`).
- `backend/Directory.Build.props` — Reglas de compilación (`net10.0`, `Nullable=enable`, `TreatWarningsAsErrors=true`).

## 5. Reglas obligatorias
1. **Controllers delgados**: un Controller solo valida la entrada, verifica el contexto de host/tenant, invoca el servicio de aplicación pasando `CancellationToken` y transforma el `Result<T>` en respuesta HTTP.
2. **Prohibido exponer entidades de EF Core**: todo endpoint debe recibir y devolver DTOs (`record`) explícitos.
3. **Propagación de `CancellationToken`**: todo método asíncrono en Controllers y servicios de aplicación que realice I/O debe aceptar `CancellationToken cancellationToken = default` y pasarlo a EF Core (`ToListAsync(cancellationToken)`, `SaveChangesAsync(cancellationToken)`).
4. **Errores en formato `ProblemDetails` (RFC 9457)**: nunca devolver strings planos ni objetos ad-hoc en errores `4xx`/`5xx`; usar `this.ToProblem(result.Error)` o `this.ToValidationProblem(validationResult)`.
5. **Cero warnings de compilación**: `TreatWarningsAsErrors` está habilitado en toda la solución.

## 6. Patrones permitidos
- Inyección por constructor primario de C# 12/13 en Controllers y servicios (`public sealed class MyService(ApplicationDbContext dbContext) : IMyService`).
- Uso de `FluentValidation` en `Knorooms.Api/Validation` para validar formatos complejos de entrada (slugs, correos, rangos de tiempo) antes de invocar la capa de aplicación.
- Autorización declarativa por permiso en cada acción mediante `[Authorize(Policy = PermissionCatalog.SomePermission)]`.

## 7. Antipatrones prohibidos
- Inyectar `ApplicationDbContext` directamente en un Controller para escribir consultas de negocio en línea.
- Capturar excepciones genéricas (`catch (Exception)`) en Controllers para ocultar fallos o devolver `200 OK` con `{ success: false }`.
- Usar `.Result` o `.Wait()` bloqueantes sobre tareas asíncronas.
- Registrar en logs tokens JWT, cookies o secretos de configuración.

## 8. Flujo recomendado paso a paso
1. Definir los DTOs de entrada/salida en `Contracts/` del módulo correspondiente.
2. Implementar el caso de uso en el servicio de aplicación del módulo devolviendo `Result<TDto>`.
3. Si el request HTTP requiere validación de formato, crear un `AbstractValidator<TRequest>` en `Knorooms.Api/Validation/`.
4. Exponer el endpoint en el Controller apropiado, decorar con `[Authorize(Policy = ...)]` y delegar al servicio.
5. Mapear el resultado con `result.IsFailure ? this.ToProblem(result.Error) : Ok(result.Value)`.

## 9. Checklist de verificación
- [ ] ¿El endpoint tiene `[Authorize(Policy = PermissionCatalog....)]` o `[AllowAnonymous]` explícito y justificado?
- [ ] ¿Se propaga `CancellationToken` desde la acción del Controller hasta EF Core?
- [ ] ¿Los errores devuelven `application/problem+json` con `errorCode` y `traceId`?
- [ ] ¿Compila `Knorooms.slnx` con `0 Warning(s)` y `0 Error(s)`?

## 10. Comandos reales del repositorio
```powershell
dotnet build backend/Knorooms.slnx
dotnet format backend/Knorooms.slnx --verify-no-changes
```
