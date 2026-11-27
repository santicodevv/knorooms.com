# Primer prompt para Codex — implementar el diseño del portal del colegio

Pegar el bloque siguiente en Codex CLI, abierto en la raíz del repositorio. Antes, abrir Codex y confirmar que ve las skills (`/skills`: `impeccable`, `frontend-design`, `emil-design-eng`) y el MCP de Figma (`/mcp`).

```text
Vas a implementar en código el diseño de Figma del portal de colegios de KNOROOMS. Trabaja por fases y no avances a la siguiente sin mi aprobación.

1. Lee primero, en este orden: AGENTS.md, apps/web/AGENTS.md, docs/design/figma-implementation.md (fuente de verdad), docs/design/school-portal.md (solo reglas funcionales; su dirección visual la sustituye el Figma) y las skills knorooms-frontend-nextjs, impeccable, frontend-design y emil-design-eng.
2. Obtén el diseño con el MCP de Figma (archivo 2giF5teP0UvaVwfOuNuSEt, página «Knorooms»). Empieza con get_metadata de la página, y por cada pantalla usa get_design_context y get_screenshot. Lee también las variables del archivo con get_variable_defs.
3. Antes de escribir código, entrégame un plan corto para la FASE 0 y la FASE 1 del documento:
   - FASE 0: tokens de color, tipografía IBM Plex Sans con next/font, radios y espaciado en Tailwind v4; primitivas de src/components/ui (Button, Input, Select, Badge, Card, Table, Segmented/Tabs, Dialog, SidePanel, EmptyState, Alert, Skeleton, Checkbox, Switch).
   - FASE 1: Login con sus estados (secciones «1 · Login» y «1 · Login · Estados»), el shell del portal con el sidebar agrupado y el Inicio (sección «2 · Inicio»: vacío, con aviso de suscripción y con datos).
   Indica qué archivos de apps/web crearás o cambiarás y qué componentes existentes reutilizarás. Espera mi aprobación.
4. Tras aprobar, implementa con subagentes: figma-to-code para construir, testing para pruebas de hooks y esquemas, design-reviewer para comparar cada pantalla con su frame, y security-auditor si hay mutaciones. Máximo 4 en paralelo.

Reglas que no se negocian:
- Los datos del Figma son ejemplos: ningún dato simulado en las vistas. Todo sale del BFF, con estados vacío, carga, error y sin permiso.
- FSD obligatorio: schemas, api, hooks sin JSX, components. Páginas delgadas. Sin shadcn/ui ni Radix.
- No tocar el backend. No implementar lo marcado «requiere backend» ni «oculto» en el documento (Roles y permisos, crear usuarios, Acceso de soporte, modo soporte, Auditoría).
- Nunca enviar TenantId ni guardar tokens en el navegador.
- Movimiento solo con transform y opacity, prefers-reduced-motion respetado, foco visible.
- Al terminar cada fase ejecuta en apps/web: pnpm format:check, pnpm lint, pnpm typecheck, pnpm test y pnpm build, y muéstrame el resultado real. No declares una pantalla terminada sin esas pruebas ni sin la revisión de design-reviewer.
- Trabaja en una rama feature/KNO-<n>-... según CONTRIBUTING.md; no hagas commit en main.

Si algo del diseño choca con una regla del proyecto o con el backend, detente y pregúntame.
```

## Prompts siguientes (uno por fase)

- Fase 2: «Continúa con la FASE 2 de docs/design/figma-implementation.md: Estudiantes (lista, crear en panel lateral, ficha con pestañas, vincular responsable, trasladar, retirar, desactivar) y Responsables. Mismo método: plan breve, aprobación, implementación con subagentes y pruebas.»
- Fase 3: «… FASE 3: Académico (años con cierre, grados y secciones, materias, carga docente con vista Por docente, matrículas).»
- Fase 4: «… FASE 4: Asistencia, libro de notas y boletas con detalle e historial.»
- Fase 5: «… FASE 5: Ajustes (colegio, usuarios en solo lectura con revocar, políticas, Moodle).»
- Fase 6: «… FASE 6: aceptar invitación, errores de acceso y estados del sistema como patrón global.»
