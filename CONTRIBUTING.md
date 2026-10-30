# Cómo contribuir a KNOROOMS

El proceso completo (roles, ceremonias, tablero, DoR/DoD) está en [docs/SCRUM.md](docs/SCRUM.md). Las reglas técnicas obligatorias están en [AGENTS.md](AGENTS.md).

## Antes de empezar

1. Todo cambio parte de un ticket de Jira del proyecto **KNO** que esté en el sprint activo.
2. Asígnate el ticket y muévelo a **En curso**.

## Ramas

Crea la rama desde `main` actualizado, con la clave del ticket:

| Tipo | Ejemplo |
| --- | --- |
| Historia | `feature/KNO-12-exportar-boleta-pdf` |
| Error | `fix/KNO-31-sesion-expira-antes` |
| Tarea | `chore/KNO-7-dependabot`, `test/KNO-9-pruebas-attendance`, `docs/KNO-5-proceso-scrum` |

## Commits

[Conventional Commits](https://www.conventionalcommits.org/es/) con el módulo como ámbito y la clave al inicio de la descripción:

```text
feat(reportcards): KNO-12 exportar boleta en PDF
fix(identity): KNO-31 rotar refresh token al renovar sesión
test(attendance): KNO-9 cubrir registro duplicado por fecha
```

## Pull requests

- El **título lleva la clave**: `feat(reportcards): KNO-12 exportar boleta en PDF`.
- Completa la plantilla (el campo *Ticket de Jira* es obligatorio).
- Checks requeridos para mergear a `main`: CI backend, CI frontend y **Ticket de Jira**.
- Se necesita 1 aprobación; un commit nuevo descarta la aprobación anterior y todas las conversaciones deben quedar resueltas.
- Al abrir el PR el ticket pasa solo a **En revisión**; al mergearlo pasa a **Listo** con un comentario que enlaza el PR.

## Verificación local

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
cd backend && dotnet build Knorooms.slnx && dotnet test Knorooms.slnx
cd apps/web && pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```
