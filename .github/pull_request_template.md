## Ticket de Jira (obligatorio)

<!-- El título del PR o la rama debe contener la clave. Ejemplo: feat(grading): KNO-12 registrar notas por período -->

KNO-

## Qué cambia y por qué

-

## Cómo se probó

- [ ] `dotnet build Knorooms.slnx` y `dotnet test Knorooms.slnx` (si toca `backend/`)
- [ ] `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build` (si toca `apps/web/`)
- [ ] Prueba manual (describir):

## Checklist (Definition of Done)

- [ ] Hay pruebas nuevas o actualizadas.
- [ ] No se debilitan políticas RLS ni se acepta `TenantId` desde el cliente.
- [ ] No se registran contraseñas, tokens ni secretos en logs o auditoría.
- [ ] Migraciones EF Core revisadas (si aplica).
- [ ] Documentación en `docs/` actualizada (si aplica).
