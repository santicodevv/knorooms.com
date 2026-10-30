# Proceso Scrum de KNOROOMS

Este documento define cómo trabaja el equipo de KNOROOMS: roles, ceremonias, tablero, estimación y la integración entre Jira y GitHub. Aplica a todo cambio que llegue a `main`.

- **Jira**: <https://welin1924-1793141597420.atlassian.net/jira/software/projects/KNO/boards/1>
- **Clave del proyecto**: `KNO` (tickets `KNO-<n>`)
- **Repositorio**: <https://github.com/santicodevv/knorooms.com>
- **Sprint**: 2 semanas, de lunes a viernes de la semana siguiente.
- **Equipo**: 4-5 personas.

## 1. Roles

| Rol | Responsabilidad |
| --- | --- |
| **Product Owner (PO)** | Ordena el backlog según el [alcance](product/scope.md) y la [secuencia de implementación](product/implementation-roadmap.md); acepta o rechaza historias contra sus criterios. |
| **Scrum Master (SM)** | Facilita ceremonias, elimina impedimentos y cuida que se respeten la Definition of Ready y la Definition of Done. |
| **Equipo de desarrollo (3-4 personas)** | Estima, se compromete con el objetivo del sprint, implementa, revisa los PR de sus compañeros y mantiene la calidad (backend .NET, frontend Next.js, base de datos y DevOps). |

En un equipo de 4-5 personas el SM puede ser también desarrollador; el PO no debería revisar su propio trabajo como aprobación única.

## 2. Ceremonias

| Ceremonia | Cuándo | Duración máxima | Resultado |
| --- | --- | --- | --- |
| **Sprint Planning** | Lunes de inicio de sprint | 2 h | Objetivo del sprint y tickets comprometidos, todos estimados y en estado *Ready*. |
| **Daily Scrum** | Cada día hábil, misma hora | 15 min | Qué hice, qué haré, qué me bloquea. Los bloqueos se resuelven fuera de la daily. |
| **Backlog Refinement** | Miércoles de la primera semana | 1 h | Tickets de los próximos 1-2 sprints con descripción, criterios de aceptación y estimación. |
| **Sprint Review** | Viernes final del sprint | 1 h | Demo de lo terminado (solo lo que cumple la DoD) al PO y partes interesadas. |
| **Sprint Retrospective** | Viernes final, tras la review | 1 h | 1-3 acciones de mejora concretas, registradas como tickets con label `proceso`. |

## 3. Tipos de ticket y prefijos de rama

| Tipo en Jira | Uso | Prefijo de rama | Tipo de commit |
| --- | --- | --- | --- |
| **Historia** | Funcionalidad con valor para un usuario (administración global, colegio, docente). | `feature/` | `feat` |
| **Tarea** | Trabajo técnico: pruebas, refactor, documentación, configuración. | `chore/`, `test/`, `refactor/`, `docs/` | `chore`, `test`, `refactor`, `docs` |
| **Error** | Defecto en comportamiento existente. | `fix/` | `fix` |
| **Subtarea** | División de una historia o tarea; se trabaja en la rama del padre. | — | — |
| **Epic** | Agrupa trabajo de un área funcional (ver sección 4). | — | — |

**Convención obligatoria** (la clave `KNO-<n>` debe aparecer en la rama o en el título del PR, y se recomienda en ambos):

```text
Rama:    feature/KNO-12-exportar-boleta-pdf
Commit:  feat(reportcards): KNO-12 exportar boleta en PDF
PR:      feat(reportcards): KNO-12 exportar boleta en PDF
```

El ámbito del commit es el módulo en minúsculas (`identity`, `tenants`, `academic`, `grading`, `web`, `ci`…). Se siguen [Conventional Commits](https://www.conventionalcommits.org/es/).

## 4. Épicas por área

| Épica | Módulos / carpetas |
| --- | --- |
| **Plataforma SaaS y administración global** | `Tenants`, `Platform`, `Subscriptions`, `Entitlements`, `apps/web/src/features/platform`, `features/subscriptions` |
| **Identidad, seguridad y acceso** | `Identity`, `Authorization`, `SupportAccess`, `Audit`, BFF de autenticación (`features/auth`, `lib/auth`) |
| **Estructura académica y estudiantes** | `Academic`, `Students`, `Enrollments`, `features/school/academic`, `features/school/students` |
| **Evaluación: asistencia, notas y boletas** | `Attendance`, `Grading`, `ReportCards`, `features/school/evaluations` |
| **Integración Moodle** | Orden 4 del roadmap (pendiente; no se inicia sin decisión del PO). |
| **Infraestructura y DevOps** | `.github/`, `infrastructure/`, CI/CD, protección de ramas, proceso. |

## 5. Flujo del tablero

```text
Por hacer ──► En curso ──► En revisión ──► Listo
```

| Columna | Entra cuando… | Quién lo mueve |
| --- | --- | --- |
| **Por hacer** | El ticket está en el sprint y cumple la DoR. | PO / equipo en planning |
| **En curso** | Alguien se lo asigna y crea la rama con la clave. | La persona asignada (manual) |
| **En revisión** | Se abre (o reabre, o pasa a *ready*) un PR con la clave. | **Automático** (`jira-transiciones.yml`) |
| **Listo** | El PR se mergea a `main`. | **Automático**, con comentario y enlace al PR |

> En Jira el estado final puede llamarse *Listo* o *Finalizado*; el workflow acepta ambos. "En revisión" debe tener categoría *En curso*.

Límite de trabajo en curso: máximo **2 tickets En curso por persona**.

## 6. Estimación

- Story points en serie de **Fibonacci**: 1, 2, 3, 5, 8, 13. Un ticket de 13 se divide antes de entrar al sprint.
- Referencia: **1** = cambio trivial con prueba; **3** = caso de uso pequeño con pruebas unitarias e integración; **8** = vertical completa backend + frontend + migración.
- Se estima en el campo *Story point estimate* de Jira mediante planning poker.
- Capacidad inicial: ~25-30 puntos por sprint para 4-5 personas; se ajusta con la velocidad real de los tres últimos sprints.

## 7. Definition of Ready (DoR)

Un ticket puede entrar a un sprint si:

- [ ] Tiene título claro, descripción con el *por qué* y épica padre.
- [ ] Tiene criterios de aceptación verificables en formato checklist.
- [ ] Está estimado y vale 8 puntos o menos.
- [ ] Sus dependencias están resueltas o identificadas.
- [ ] Si toca reglas académicas, la regla está validada (nada de fórmulas MINERD no confirmadas; se modelan con `EvaluationPolicyVersion`).
- [ ] Si toca datos institucionales, se identificó el impacto en RLS y migraciones.

## 8. Definition of Done (DoD)

Un ticket está terminado cuando:

- [ ] El código está en `main` mediante un PR con la clave `KNO-<n>`, aprobado por al menos 1 revisor.
- [ ] Pasan los checks requeridos: CI backend, CI frontend y *Ticket de Jira*.
- [ ] Hay pruebas nuevas o actualizadas (unitarias, de arquitectura o integración con PostgreSQL real según corresponda).
- [ ] No se debilitaron políticas RLS, no se acepta `TenantId` del cliente y no se registran secretos en logs ni auditoría.
- [ ] La documentación afectada (`docs/`, ADR, `AGENTS.md`) está actualizada en español.
- [ ] Las migraciones EF Core nuevas se revisaron con la Skill `knorooms-database-migrations`.
- [ ] Se cumplen los criterios de aceptación y el PO lo aceptó en la review.

## 9. Integración Jira ↔ GitHub

La integración se hace con GitHub Actions y la API REST de Jira; no depende de la app "GitHub for Jira".

### 9.1 Workflows

| Archivo | Check / Job | Qué hace |
| --- | --- | --- |
| [`.github/workflows/jira.yml`](../.github/workflows/jira.yml) | **Ticket de Jira** | Falla si ni la rama ni el título del PR contienen `KNO-<n>`. Es check requerido para mergear a `main`. |
| [`.github/workflows/jira-transiciones.yml`](../.github/workflows/jira-transiciones.yml) | Mover tickets en Jira | PR abierto/reabierto/listo → **En revisión** (si no existe, **En curso**). PR mergeado → **Listo**/**Finalizado** y comentario con el enlace al PR. |

`jira-transiciones.yml`:

1. Si faltan los secretos, emite un *warning* y termina con éxito (no bloquea PR de forks).
2. Valida las credenciales con `GET /rest/api/3/myself` y muestra el código HTTP. Con credenciales inválidas Jira responde como anónimo y devuelve 404 en los tickets, lo que confunde; por eso se valida primero.
3. Prueba primero la URL del sitio y luego el gateway `https://api.atlassian.com/ex/jira/458f8beb-c5e4-4dcb-bb26-53dd22dec8d3` (los tokens con alcances solo funcionan en el gateway).

> Los workflows de `pull_request` usan la versión del workflow que está en la rama del PR. Para probar un cambio del workflow, **cierra y reabre el PR**; un *re-run* repite la versión anterior.

### 9.2 Secretos del repositorio

| Secreto | Valor |
| --- | --- |
| `JIRA_USER_EMAIL` | Email de la cuenta Atlassian dueña del token. |
| `JIRA_API_TOKEN` | API token creado en <https://id.atlassian.com/manage-profile/security/api-tokens> → *Create API token*. |

Nunca pegues tokens en chats, tickets ni commits. Para probar y guardar el token (fish):

```fish
read -s -P "Token: " JT
curl -s -o /dev/null -w '%{http_code}\n' -u "tu-email@ejemplo.com:$JT" https://welin1924-1793141597420.atlassian.net/rest/api/3/myself   # debe imprimir 200
printf '%s' $JT | gh secret set JIRA_API_TOKEN --repo santicodevv/knorooms.com
printf '%s' tu-email@ejemplo.com | gh secret set JIRA_USER_EMAIL --repo santicodevv/knorooms.com
set -e JT
gh secret list --repo santicodevv/knorooms.com
```

### 9.3 Protección de `main`

Ruleset de GitHub sobre `main`: PR obligatorio con 1 aprobación, se descartan aprobaciones al subir commits nuevos, conversaciones resueltas, checks requeridos (CI backend, CI frontend y *Ticket de Jira*) con rama al día, sin force-push ni borrado. Mientras haya un único revisor posible, el rol Admin puede saltarse la regla solo al mergear PR (modo `pull_request`); en cuanto haya un segundo revisor se elimina ese bypass.

## 10. Flujo diario

1. Toma un ticket de **Por hacer** en el sprint activo, asígnatelo y muévelo a **En curso**.
2. Crea la rama desde `main` actualizado: `git switch -c feature/KNO-12-descripcion-corta`.
3. Haz commits con la clave: `feat(modulo): KNO-12 ...`.
4. Ejecuta compilación y pruebas locales (ver `AGENTS.md` §6).
5. Abre el PR con la clave en el título y completa la plantilla → el ticket pasa solo a **En revisión**.
6. Atiende la revisión hasta tener aprobación y checks en verde.
7. Mergea → el ticket pasa solo a **Listo** con el enlace al PR.
