# Dependencias del frontend — corrección de seguridad KNO-73

Fecha: 24/11/2026. Corrección independiente del rediseño del portal escolar KNO-72.

## Motivo y alcance

El árbol anterior contenía Next.js 16.4.3, Vitest y cobertura V8 3.2.7. `pnpm build` mostró un recordatorio de vulnerabilidad y `pnpm audit` informó 16 avisos: 2 críticos, 1 alto y 13 moderados, incluidos paquetes de herramientas de desarrollo. El recuento no demuestra que cada aviso sea explotable en esta aplicación.

Se actualizaron únicamente estas dependencias directas y sus resoluciones transitivas necesarias:

| Dependencia | Versión anterior | Versión corregida |
| --- | --- | --- |
| `next` | 16.4.3 | 16.4.5 |
| `eslint-config-next` | 16.4.3 | 16.4.5 |
| `vitest` | 3.2.7, rango `^3.0.7` | 4.1.12 |
| `@vitest/coverage-v8` | 3.2.7 | 4.1.12 |

Next.js y su configuración de ESLint se mantienen en la misma versión. Vitest y su proveedor V8 se fijan en la misma versión exacta, compatible con Node.js 22 del proyecto. Se conserva pnpm 10.28.2 y el resto de dependencias directas.

Vitest 4 elimina `tinypool` del árbol de pruebas; el proveedor V8 ya no utiliza `test-exclude`, `glob` y sus versiones antiguas de `minimatch`. La actualización de ESLint resuelve `zod` en la versión 4 admitida por su consumidor. Para eliminar el último aviso de `minimatch`, se actualizaron las resoluciones de `typescript-eslint` y `@typescript-eslint/*` a 8.74.0, dentro de los rangos declarados por los paquetes padres. No se añadieron excepciones de auditoría ni sustituciones de versiones fuera de rango.

## Compatibilidad y reproducción

Se revisó la [publicación oficial de seguridad de Next.js](https://nextjs.org/blog/november-2026-security-release), el [aviso corregido de `@vitest/mocker`](https://github.com/vitest-dev/vitest/security/advisories/GHSA-qxg6-89mg-rqv8) y la [guía de migración a Vitest 4](https://v4.vitest.dev/guide/migration.html). El proveedor V8 ahora usa análisis AST; sus porcentajes pueden variar respecto a Vitest 3. La configuración existente ya especifica `coverage.include` y conserva todos los archivos fuente incluidos, así como los informes JSON, HTML y LCOV utilizados por CI.

Desde `apps/web`:

```powershell
pnpm install --frozen-lockfile
pnpm audit
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
node ../../.github/scripts/test-summary.mjs vitest test-results/vitest-results.json coverage/coverage-summary.json
pnpm build
```

La corrección conserva los controles de sesión, CSRF y aislamiento institucional. No introduce cambios de backend ni inicia la fase 1 del diseño.

## Verificación del cambio aislado

En el checkout de KNO-73, `pnpm audit` terminó con código 0 y ningún aviso conocido. `pnpm test` y `pnpm test:coverage` terminaron con código 0: 64 pruebas en 16 archivos, sin fallos ni omisiones. El script de resumen de CI leyó correctamente los informes y terminó con código 0. No fue necesario cambiar pruebas ni configuración de Vitest, ni reducir el alcance de la cobertura o sus umbrales.

El subagente de seguridad revisó el cambio y repitió la auditoría sin hallazgos bloqueantes. La validación conjunta con las primitivas de KNO-72 se registra en [school-portal.md](../design/school-portal.md).
