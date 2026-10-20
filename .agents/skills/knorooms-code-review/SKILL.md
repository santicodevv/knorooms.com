---
name: knorooms-code-review
description: Checklist de revisión de código arquitectónica, de seguridad multi-tenant, rendimiento y calidad para Pull Requests y cambios en KNOROOMS.
---

# Skill: Revisión de Código y Auditoría de Calidad (`knorooms-code-review`)

## 1. Propósito
Realizar revisiones rigurosas de cambios en KNOROOMS antes de integrarlos, detectando vulnerabilidades de aislamiento multi-tenant, fugas de tokens en el BFF, violaciones de límites modulares, problemas de rendimiento en EF Core (`N+1`) o incumplimiento de las convenciones de idioma y formato.

## 2. Cuándo debe activarse
- Al revisar un Pull Request o conjunto de cambios (`git diff`) antes de hacer commit.
- Al auditar un módulo existente en busca de riesgos de seguridad o deuda técnica.

## 3. Cuándo no debe activarse
- Durante la exploración inicial de lectura antes de que existan cambios propuestos o código a evaluar.

## 4. Archivos y directorios relevantes
- Todo cambio reportado por `git status` y `git diff`.
- `AGENTS.md`, `backend/AGENTS.md` y `apps/web/AGENTS.md`.
- `.github/workflows/ci.yml`.

## 5. Reglas obligatorias de revisión (Bloqueantes)
1. **Aislamiento Multi-Tenant (Severidad Crítica)**:
   - ¿Algún endpoint institucional acepta `TenantId` enviado por el cliente? (Debe rechazarse).
   - ¿Alguna nueva tabla institucional carece de `ENABLE` + `FORCE ROW LEVEL SECURITY` o de clave foránea compuesta `(tenant_id, <fk>_id)`?
   - ¿Se usa `.IgnoreQueryFilters()` fuera de un flujo de plataforma estrictamente justificado?
2. **Seguridad y Autenticación (Severidad Crítica)**:
   - ¿Se expone algún token (`access_token`, `refresh_token`) al navegador o en logs?
   - ¿Falta `[Authorize(Policy = PermissionCatalog....)]` en algún endpoint nuevo?
   - ¿Las rutas mutantes del BFF verifican `Origin` y `X-CSRF-Token`?
3. **Arquitectura Modular (Severidad Alta)**:
   - ¿Algún módulo referencia clases en `.Domain`, `.Application` o `.Infrastructure` de otro módulo en lugar de `.Contracts`?
   - ¿Algún Controller contiene lógica de negocio o expone entidades de EF Core directamente?
4. **Calidad y Convenciones (Severidad Media)**:
   - ¿El código e identificadores están 100% en inglés y la documentación/UI 100% en español?
   - ¿Se propagan los `CancellationToken` en todas las llamadas asíncronas?

## 6. Patrones permitidos
- Emitir hallazgos clasificados por severidad (`Crítico`, `Alto`, `Medio`, `Bajo`) con enlaces exactos al archivo y línea afectada y una propuesta concreta de corrección.

## 7. Antipatrones prohibidos
- Aprobar cambios sin haber ejecutado las suites de pruebas (`dotnet test` y `pnpm test`) y los verificadores de formato/tipado.
- Ignorar advertencias del compilador o de ESLint.

## 8. Flujo recomendado paso a paso
1. Inspeccionar `git status` y `git diff` para identificar todos los archivos modificados.
2. Evaluar cada archivo contra la matriz de Seguridad Multi-Tenant, BFF/Autenticación, Límites Modulares y EF Core.
3. Ejecutar la suite completa de verificación local (formato, build, tests unitarios, tests de integración).
4. Emitir el dictamen de revisión o corregir inmediatamente cualquier hallazgo bloqueante.

## 9. Checklist de verificación
- [ ] `dotnet format backend/Knorooms.slnx --verify-no-changes` pasa sin diferencias.
- [ ] `dotnet test backend/Knorooms.slnx` pasa al 100% (Unit + Integration con PostgreSQL real).
- [ ] `pnpm --dir apps/web format:check`, `lint`, `typecheck`, `test` y `build` pasan al 100%.
- [ ] No existen secretos, archivos `.env` locales ni artefactos temporales en el árbol de Git.

## 10. Comandos reales del repositorio
```powershell
git status
dotnet format backend/Knorooms.slnx --verify-no-changes
dotnet test backend/Knorooms.slnx
pnpm --dir apps/web format:check
pnpm --dir apps/web lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web test
pnpm --dir apps/web build
```
