---
name: knorooms-frontend-nextjs
description: Desarrollo Frontend escalable en Next.js 16 (App Router) para KNOROOMS: separación estricta entre lógica (hooks/api/schemas) y componentes presentacionales reutilizables, TypeScript estricto, Tailwind CSS v4, shadcn/ui y enrutamiento multi-tenant por subdominio (proxy.ts).
---

# Skill: Arquitectura Frontend Escalable en Next.js 16 y BFF (`knorooms-frontend-nextjs`)

## 1. Propósito
Garantizar que todo desarrollo en `apps/web/` mantenga una arquitectura **altamente escalable, modular y mantenible**, separando de forma estricta la **lógica de estado, validación y acceso a datos (`schemas/`, `api/`, `hooks/`)** de los **componentes visuales reutilizables (`components/shared/` y `features/<modulo>/components/`)**, con enrutamiento seguro por subdominio e interfaz en español.

## 2. Cuándo debe activarse
- Al crear o modificar páginas, layouts, formularios, tablas o flujos interactivos en `apps/web/`.
- Al consumir nuevos endpoints del backend desde Server Components o Client Components.
- Al refactorizar componentes de UI para mejorar reutilización y escalabilidad.
- Al ajustar el enrutamiento por host/subdominio en `apps/web/src/proxy.ts`.

## 3. Cuándo no debe activarse
- Para cambios exclusivos en proyectos C# dentro de `backend/`.

## 4. Archivos y directorios relevantes
- `apps/web/src/proxy.ts` — Reescritura de rutas por subdominio (`localhost` -> público, `admin.localhost` -> `/platform`, `<slug>.localhost` -> `/school`).
- `apps/web/src/components/ui/` — Primitivas base de `shadcn/ui` (`Button`, `Card`, `Table`, `Badge`, `Alert`, `Input`, `Label`).
- `apps/web/src/components/shared/` — Componentes compuestos reutilizables en todo el SaaS (`SectionCard`, `EmptyState`, `FeedbackBanner`, `RefreshButton`, `FormFieldError`, `InstitutionStatusBadge`, `MembershipStatusBadge`, `SupportGrantStatusBadge`, `AccessTypeBadge`).
- `apps/web/src/features/<feature>/` — Módulos funcionales divididos obligatoriamente en:
  - `schemas/` — Esquemas `zod`, tipos inferidos y constantes de validación.
  - `api/` — Funciones cliente puras que llaman a `bffFetch`.
  - `hooks/` — Custom hooks (`use-*.ts`) con toda la lógica de estado, `react-hook-form` y mutaciones (0% JSX).
  - `components/` — Componentes presentacionales puros que reciben datos y callbacks por `props`.
- `apps/web/src/lib/api/` — `server-api.ts` (Server Components), `bff-client.ts` (Client Components) y `types.ts`.

## 5. Reglas obligatorias
1. **Separación estricta entre lógica y presentación (Regla de Oro de Escalabilidad)**:
   - **Prohibido** escribir llamadas `bffFetch`, definiciones de esquemas `zod` o múltiples manejadores de mutación directamente dentro de un componente con JSX extenso.
   - Toda llamada HTTP del lado cliente debe residir en `src/features/<feature>/api/<feature>-api.ts`.
   - Todo esquema de validación debe residir en `src/features/<feature>/schemas/<feature>-schemas.ts`.
   - Todo manejo de estado interactivo (`useState`, `useForm`, `router.refresh`, estados de carga y error) debe encapsularse en un custom hook dentro de `src/features/<feature>/hooks/use-<feature>.ts`.
   - Los componentes en `components/` deben ser **presentacionales, pequeños y enfocados en una sola responsabilidad**, recibiendo datos y callbacks tipados por `props`.
2. **Máxima reutilización de componentes**:
   - Antes de crear un nuevo contenedor de sección, estado vacío, alerta de éxito/error, badge de estado o mensaje de error de campo, reutilizar los componentes de `src/components/shared/` (`SectionCard`, `EmptyState`, `FeedbackBanner`, `RefreshButton`, `FormFieldError`, `StatusBadge`).
   - Si un patrón visual se repite en 2 o más vistas (por ejemplo, encabezados de tabla con botón de refresco, tarjetas de formulario, badges de estado), extraerlo a `src/components/shared/`.
3. **Idioma**: toda la interfaz de usuario, etiquetas, placeholders, mensajes de validación Zod y estados vacíos o de error deben estar en **español** (`<html lang="es">`). Todos los nombres de variables, tipos, funciones, hooks y archivos deben estar en **inglés**.
4. **Enrutamiento en Next.js 16 (`src/proxy.ts`)**: usar exclusivamente `src/proxy.ts` (función `proxy`). Prohibir el acceso directo por ruta a `/platform` o `/school` cuando el `Host` no corresponda.
5. **Módulos con secretos marcados con `import 'server-only'`**: cualquier archivo que acceda a Redis, claves de cifrado o cliente OIDC debe importar `'server-only'` en la primera línea.

## 6. Patrones permitidos
- **Patrón Hook + Orquestador Delgado + Componentes Presentacionales**:
  - Un componente orquestador (ej. `PlatformConsole`, `MembersManager`, `SupportAccessManager`) invoca el hook (`usePlatformConsole`, `useSchoolMembers`, `useSupportAccessGrants`) y compone `<FeedbackBanner />` + tablas/formularios presentacionales en menos de 90 líneas.
- **Server Components para carga inicial SSR**: las páginas en `src/app/` obtienen la sesión y los datos iniciales en el servidor mediante `serverApiFetch` y los pasan como `initial*` al orquestador.

## 7. Antipatrones prohibidos
- Crear "mega-componentes" (>200 líneas) que mezclen esquemas Zod, `useForm`, `bffFetch` y cientos de líneas de JSX en un mismo archivo.
- Duplicar estructuras de `Card` + `CardHeader` + `RefreshCw` o bloques de `EmptyState` manualmente en cada tabla en lugar de usar `<SectionCard />`, `<RefreshButton />` y `<EmptyState />`.
- Guardar tokens OIDC o datos sensibles en `localStorage` o `sessionStorage`.
- Usar `any` o deshabilitar reglas de TypeScript (`@ts-ignore`).

## 8. Flujo recomendado paso a paso para agregar una nueva funcionalidad de UI
1. **Tipos**: agregar los DTOs del contrato en `apps/web/src/lib/api/types.ts`.
2. **Esquemas (`schemas/`)**: si hay formularios, crear el esquema `zod` en `src/features/<feature>/schemas/`.
3. **Servicio API (`api/`)**: crear las funciones de lectura/mutación con `bffFetch` en `src/features/<feature>/api/`.
4. **Custom Hook (`hooks/`)**: implementar `use<Feature>` en `src/features/<feature>/hooks/` gestionando estado, formularios, `ProblemDetails` y refresco.
5. **Componentes Presentacionales (`components/`)**: construir componentes pequeños usando `src/components/shared/` (`SectionCard`, `EmptyState`, `FormFieldError`, `StatusBadge`) y `src/components/ui/`.
6. **Página App Router (`src/app/`)**: conectar la carga inicial en el Server Component y verificar con `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build`.

## 9. Checklist de verificación
- [ ] ¿La lógica (`api/`, `schemas/`, `hooks/`) está completamente separada del JSX (`components/`)?
- [ ] ¿Se reutilizaron los componentes de `src/components/shared/` (`SectionCard`, `EmptyState`, `FeedbackBanner`, `RefreshButton`, `FormFieldError`, `StatusBadge`)?
- [ ] ¿Ningún componente mezcla llamadas `bffFetch` directas con maquetación JSX?
- [ ] ¿Toda la interfaz está en español y el código en inglés?
- [ ] ¿Pasan `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build` sin errores?

## 10. Comandos reales del repositorio
```powershell
pnpm --dir apps/web format:check
pnpm --dir apps/web lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web test
pnpm --dir apps/web build
```
