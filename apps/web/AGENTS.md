# Guía de Arquitectura y Convenciones — `apps/web` (KNOROOMS Frontend + BFF)

Este documento define las reglas técnicas, de arquitectura escalable, de seguridad y de diseño para la aplicación web Next.js 16 (`apps/web`) del monorepo **KNOROOMS**.

## 1. Principios Fundamentales

- **Idioma**: Toda la interfaz de usuario, mensajes de error y textos visibles deben estar en **español**. Todo el código fuente (identificadores, tipos, funciones, rutas de archivos) debe estar en **inglés**.
- **Separación estricta entre lógica y presentación (Escalabilidad Obligatoria)**:
  - **Prohibido mezclar lógica de negocio, llamadas `bffFetch`, definiciones de esquemas `zod` o estados complejos (`useState` / `useForm`) dentro de archivos de componentes visuales grandes.**
  - Todo módulo funcional vive en `src/features/<feature>/` y se divide obligatoriamente en 4 capas:
    1. `schemas/`: esquemas `zod`, tipos inferidos y constantes de validación (`platform-schemas.ts`).
    2. `api/`: funciones puras de cliente que encapsulan las llamadas a `bffFetch` (`platform-api.ts`, `school-api.ts`).
    3. `hooks/`: custom React hooks (`use-*.ts`) que encapsulan `useState`, `useForm`, manejo de errores `ProblemDetails` y mutaciones, sin una sola línea de JSX (`use-platform-console.ts`, `use-school-members.ts`, `use-support-access-grants.ts`).
    4. `components/`: componentes presentacionales pequeños, enfocados y reutilizables que reciben datos y callbacks por `props` (`institutions-table.tsx`, `create-institution-form-card.tsx`, `members-table.tsx`, `support-grants-table.tsx`).
- **Componentes altamente reutilizables (`src/components/shared/` y `src/components/ui/`)**:
  - `src/components/ui/`: primitivas atómicas de `shadcn/ui` (`button`, `card`, `table`, `badge`, `alert`, `input`, `label`).
  - `src/components/shared/`: bloques compuestos reutilizables transversalmente en toda la aplicación (`SectionCard`, `EmptyState`, `FeedbackBanner`, `RefreshButton`, `FormFieldError`, `InstitutionStatusBadge`, `MembershipStatusBadge`, `SupportGrantStatusBadge`, `AccessTypeBadge`).
- **Sin datos simulados (No Fake Data)**: Ninguna vista puede mostrar datos ficticios hardcodeados. Los componentes deben consumir exclusivamente la API real a través del BFF y manejar explícitamente estados vacíos y errores `application/problem+json` (RFC 9457).
- **Patrón BFF (Backend-for-Frontend)**: El navegador **jamás** recibe ni almacena `access_token`, `refresh_token` ni `id_token`, y nunca invoca directamente `API_BASE_URL`.

## 2. Estructura de Carpetas de `apps/web/src`

```text
apps/web/src/
├── proxy.ts                            # Enrutamiento multi-tenant por subdominio (Next.js 16)
├── app/                                # App Router (páginas delgadas que cargan datos vía serverApiFetch)
│   ├── api/auth/                       # Endpoints OIDC + PKCE (login, callback, logout, session)
│   ├── api/bff/[...path]/              # Proxy BFF autenticado con verificación CSRF
│   ├── platform/                       # Rutas de consola global (admin.*)
│   └── school/                         # Rutas de portal institucional (<slug>.*)
├── components/
│   ├── ui/                             # Primitivas base shadcn/ui
│   ├── shared/                         # Componentes compuestos reutilizables (SectionCard, EmptyState, StatusBadge...)
│   ├── api/                            # Visualización estándar de ProblemDetails RFC 9457
│   ├── auth/                           # Tarjetas de login y botón de cierre de sesión
│   ├── platform/                       # Orquestador delgado de la consola de plataforma
│   └── school/                         # Orquestadores delgados del portal institucional
├── features/
│   ├── platform/
│   │   ├── api/platform-api.ts         # Llamadas BFF de plataforma
│   │   ├── schemas/platform-schemas.ts # Esquemas Zod y tipos de formularios
│   │   ├── hooks/use-platform-console.ts # Estado, formularios y mutaciones (0% JSX)
│   │   └── components/                 # Tablas y tarjetas de formulario desacopladas
│   └── school/
│       ├── api/school-api.ts           # Llamadas BFF institucionales
│       ├── hooks/                      # useSchoolMembers y useSupportAccessGrants (0% JSX)
│       └── components/                 # SchoolHeader, MembersTable, SupportGrantsTable, Banners
└── lib/
    ├── api/                            # server-api.ts, bff-client.ts, types.ts
    ├── auth/                           # oidc.ts, crypto.ts (AES-256-GCM), session-store.ts, csrf.ts
    └── tenancy/                        # host.ts (resolución pura de subdominio)
```

## 3. Enrutamiento Multi-Tenant por Subdominio (`src/proxy.ts` y `src/lib/tenancy/host.ts`)

- Next.js 16 utiliza la convención `src/proxy.ts` (que reemplaza al antiguo `middleware.ts`).
- La resolución de host se centraliza en la función pura `resolveHost` (`src/lib/tenancy/host.ts`):
  - `{APP_BASE_DOMAIN}` (ej. `localhost:3000` o `knorooms.com`) → Sitio público (`src/app/page.tsx`).
  - `admin.{APP_BASE_DOMAIN}` (`PLATFORM_SUBDOMAIN`) → Reescritura interna a `/platform/*`.
  - `{slug}.{APP_BASE_DOMAIN}` → Reescritura interna a `/school/*`.
- **Validación de `slug`**: Expresión regular `^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$`.
- **Subdominios reservados**: `www`, `admin`, `api`, `app`, `auth`, `static`, `mail`.
- **Protección de rutas internas**: Cualquier petición externa cuya ruta comience directamente por `/platform` o `/school` recibe `404 Not Found`.

## 4. Autenticación OIDC + Sesiones Cifradas en Redis (`src/lib/auth/*`)

- **Flujo OIDC**: Authorization Code Flow + PKCE (`S256`), `state` y `nonce` mediante `openid-client` v6 (`src/lib/auth/oidc.ts`).
- **Almacenamiento de Sesión**:
  - ID de sesión aleatorio de 256 bits (`generateSecureId(32)`).
  - Registro de sesión cifrado con **AES-256-GCM** (`SESSION_ENCRYPTION_KEY`, 32 bytes en Base64) en Redis bajo `session:<sessionId>`.
  - Cookie **host-only** (sin atributo `Domain`), `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` controlado por `SESSION_COOKIE_SECURE`.

## 5. Protección CSRF y Proxy BFF (`src/app/api/bff/[...path]/route.ts`)

- Toda operación mutante (`POST`, `PUT`, `PATCH`, `DELETE`) hacia `/api/bff/*` y `/api/auth/logout` exige cabecera `X-CSRF-Token` comparada en tiempo constante (`timingSafeEqual`) y validación de `Origin`.

## 6. Scripts de Verificación

Antes de finalizar cualquier cambio en `apps/web`, deben ejecutarse y pasar en verde:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
