# AGENTS.md — Guía Maestra para Agentes de IA en KNOROOMS

## 1. Qué es KNOROOMS

**KNOROOMS** es una plataforma SaaS multi-tenant de gestión académica dirigida a colegios y escuelas de República Dominicana. El alcance inicial incluye administración SaaS, suscripciones, módulos por colegio e integración opcional con Moodle. Educación superior queda fuera de la primera versión; las reglas escolares se validan con el colegio piloto y fuentes oficiales.

- **Idioma**: toda documentación, mensajes de interfaz, validaciones orientadas al usuario, comentarios explicativos, ADRs y Skills deben estar en **español**. Todo código fuente, nombres de clases, métodos, propiedades, tablas, columnas y rutas técnicas deben estar en **inglés**.
- **Documentos base preservados en la raíz**:
  - `KNOROOMS_Propuesta_SaaS_Colegios_RD.docx`
  - `Arquitectura SaaS Educativo Knorooms - Colegios y Universidades.docx`
  - **Importante**: las decisiones implementadas en el código y en `docs/decisions/` prevalecen sobre propuestas preliminares de esos documentos (por ejemplo, el backend oficial es **ASP.NET Core .NET 10 + EF Core**, no NestJS).

---

## 2. Stack Tecnológico Oficial

### Backend (`backend/`)
- **ASP.NET Core Web API** sobre **.NET 10 (LTS)** en C# con tipos de referencia anulables (`<Nullable>enable</Nullable>`).
- **Entity Framework Core 10** + **Npgsql** contra **PostgreSQL 17**.
- **Controllers REST delgados**, DTOs explícitos y respuestas de error estandarizadas con `application/problem+json` (RFC 9457).
- **FluentValidation** para validación de contratos de entrada HTTP.
- **OpenAPI** integrado.
- Inyección de dependencias nativa de ASP.NET Core, `async/await` y propagación obligatoria de `CancellationToken` en operaciones I/O.

### Frontend y BFF (`apps/web/`)
- **Next.js 16 (App Router)** con **TypeScript estricto**, **Tailwind CSS v4** y componentes propios.
- Actúa como **Backend for Frontend (BFF)**: autentica usuario/contraseña contra el backend propio, mantiene sesiones en servidor sobre **Redis** cifradas con **AES-256-GCM**, entrega cookies `HttpOnly` host-only y protege con **CSRF** (`X-CSRF-Token` + validación `Origin`). Los tokens nunca llegan al navegador.

---

## 3. Arquitectura Modular y Estructura del Repositorio

```text
knorooms/
├── AGENTS.md                        # Reglas globales para agentes
├── .agents/
│   └── skills/                      # 10 Skills especializadas del proyecto
├── .github/
│   └── workflows/ci.yml             # Pipeline CI (.NET 10 + Next.js 16)
├── docs/
│   ├── architecture/                # Contratos HTTP, RLS, seguridad y módulos
│   └── decisions/                   # Registros de decisiones de arquitectura (ADRs)
├── apps/
│   └── web/                         # Next.js App Router + BFF + Vitest
├── backend/
│   ├── Directory.Build.props        # Configuración común .NET 10
│   ├── Knorooms.slnx                # Solución .NET
│   ├── src/
│   │   ├── Knorooms.SharedKernel/   # Primitivas de dominio, Result, Tenancy, PermissionCatalog
│   │   ├── Knorooms.Modules/        # 12 módulos de negocio + ApplicationDbContext + RLS
│   │   └── Knorooms.Api/            # Host HTTP, validación JWT Bearer propia, middlewares, Controllers
│   └── tests/
│       ├── Knorooms.UnitTests/      # Pruebas de dominio, subdominios y NetArchTest
│       └── Knorooms.IntegrationTests/ # Pruebas PostgreSQL 17 real (Testcontainers) y RLS
├── infrastructure/
│   └── docker/                      # Docker Compose (PostgreSQL 17, Redis 7.4)
├── .editorconfig
├── .gitignore
├── .gitattributes
├── .env.example
└── README.md
```

### Los 12 Módulos actuales de `Knorooms.Modules`
Ubicados en `backend/src/Knorooms.Modules/Modules/<NombreModulo>/`:
1. `Identity`
2. `Tenants`
3. `Platform`
4. `Students`
5. `Academic`
6. `Enrollments`
7. `Attendance`
8. `Grading`
9. `ReportCards`
10. `Authorization`
11. `SupportAccess`
12. `Audit`

Cada módulo separa `Contracts` (público), `Domain`, `Application` (`internal`) e `Infrastructure` (`internal`).

---

## 4. Reglas Inquebrantables de Seguridad y Multi-Tenancy

1. **Identificación por subdominio ≠ autorización**:
   - El subdominio (`colegio-a.knorooms.com` o `colegio-a.localhost:3000`) solo identifica el tenant solicitado.
   - El acceso exige una membresía activa (`TenantMembership` en estado `Active`) o una concesión temporal de soporte (`SupportAccessGrant` en estado `Approved` y vigente).
2. **Prohibido confiar en un `TenantId` enviado por el cliente**:
   - `TenantAndIdentityResolutionMiddleware` rechaza con `400 Bad Request` cualquier petición que incluya la cabecera `X-Tenant-Id` o el parámetro `?tenantId=`.
3. **Row-Level Security (RLS) real en PostgreSQL**:
   - La aplicación se conecta con el rol `knorooms_app` (`NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS`).
   - Todas las tablas institucionales tienen `ENABLE ROW LEVEL SECURITY` y `FORCE ROW LEVEL SECURITY`.
   - `PostgresRlsInterceptor` sincroniza `app.current_tenant_id`, `app.current_user_id` y `app.execution_mode` mediante `set_config(..., is_local)`.
   - Las tablas académicas y de estudiantes (`students`, `guardians`, `academic_years`, `grade_levels`, `school_sections`, `subjects`, `teacher_assignments`, `student_enrollments`, `attendance_records`, `evaluation_policy_versions`, `grade_entries`, `report_card_snapshots`) **no tienen bypass para administración global**.
4. **Integridad referencial compuesta**:
   - Toda relación entre entidades institucionales utiliza claves foráneas compuestas `(tenant_id, <entidad>_id)` apuntando a la clave alternativa `(tenant_id, id)` de la tabla padre.
5. **Tokens fuera del navegador**:
   - Jamás guardar `access_token` ni `refresh_token` en `localStorage`, `sessionStorage` ni cookies legibles por JavaScript.
6. **Credenciales locales y JWT propios**:
   - KNOROOMS autentica con usuario/contraseña (PBKDF2-HMAC-SHA256, 600.000 iteraciones) y el backend emite sus propios JWT (HS256) y refresh tokens opacos con rotación obligatoria (ver `docs/decisions/0004-local-credentials-and-backend-issued-jwt.md`).

---

## 5. Lo que los Agentes NUNCA Deben Hacer

- **NO** introducir microservicios ni dividir el backend en múltiples despliegues sin autorización explícita.
- **NO** crear nuevos proyectos `.csproj` por cada módulo.
- **NO** desactivar, omitir ni debilitar políticas RLS o ejecutar la API con un rol PostgreSQL que tenga `BYPASSRLS` o `SUPERUSER`.
- **NO** aceptar `TenantId` desde query string, body o cabeceras del cliente para seleccionar el colegio activo.
- **NO** reintroducir proveedores de identidad externos (OIDC/Keycloak) ni romper el flujo de credenciales locales + JWT propios sin una decisión de arquitectura explícita (ADR).
- **NO** hacer públicas las clases de `Application` o `Infrastructure` de un módulo ni referenciarlas desde otro módulo (verificado por `ModularMonolithArchitectureTests`).
- **NO** introducir MediatR, AutoMapper, repositorios genéricos innecesarios ni dependencias sin justificación.
- **NO** usar `EnsureCreated()` en lugar de migraciones EF Core.
- **NO** sobrescribir migraciones ya aplicadas sin evaluar impacto.
- **NO** inventar fórmulas normativas del MINERD no validadas: cualquier regla de calificación debe modelarse mediante `EvaluationPolicyVersion`.
- **NO** registrar contraseñas, tokens, cookies ni secretos en `AuditLogEntry` o logs.
- **NO** dar por terminada una funcionalidad sin ejecutar compilación y pruebas reales.

---

## 6. Comandos de Desarrollo y Verificación

```powershell
# 1. Levantar PostgreSQL 17 y Redis localmente
docker compose -f infrastructure/docker/docker-compose.yml up -d

# 2. Compilar y ejecutar pruebas del backend (.NET 10 + Testcontainers PostgreSQL)
cd backend
dotnet build Knorooms.slnx
dotnet test Knorooms.slnx

# 3. Ejecutar API local (http://localhost:5080)
cd backend/src/Knorooms.Api
dotnet run

# 4. Verificar y compilar frontend Next.js BFF (apps/web)
cd apps/web
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

### Convención Jira ↔ GitHub (obligatoria)

Todo cambio parte de un ticket del proyecto Jira **KNO** (ver [docs/SCRUM.md](docs/SCRUM.md) y [CONTRIBUTING.md](CONTRIBUTING.md)):

- Rama: `feature/KNO-12-descripcion`, `fix/KNO-12-...`, `chore/KNO-12-...`, `docs/KNO-12-...`.
- Commit: `feat(modulo): KNO-12 descripción` (Conventional Commits, ámbito = módulo).
- Título del PR con la clave `KNO-<n>`; el check **Ticket de Jira** falla si falta en rama y título.
- No commitear directamente en `main`: está protegida y solo acepta PR aprobados con CI en verde.

---

## 7. Skills Locales Disponibles (`.agents/skills/`)

Antes de realizar cambios en un área especializada, lee la Skill correspondiente en `.agents/skills/<nombre>/SKILL.md`:

- `knorooms-architecture`: límites del monolito modular, contratos y pruebas NetArchTest.
- `knorooms-backend-dotnet`: desarrollo de Controllers, servicios de aplicación, `Result<T>`, FluentValidation y ProblemDetails.
- `knorooms-efcore-postgresql`: configuraciones Fluent API, claves compuestas `(tenant_id, id)`, índices y concurrencia.
- `knorooms-multi-tenancy`: resolución por subdominio, `ITenantContextAccessor`, `PostgresRlsInterceptor` y políticas RLS.
- `knorooms-security-auth`: credenciales locales + JWT emitidos por el backend, BFF con Redis AES-256-GCM, CSRF, RBAC/ABAC, MFA y soporte temporal.
- `knorooms-frontend-nextjs`: App Router, `src/proxy.ts`, layouts por subdominio, Server/Client Components y `componentes propios con Tailwind CSS`.
- `knorooms-module-development`: guía paso a paso para ampliar o crear casos de uso; los nuevos módulos previstos se rigen por ADR-0005.
- `knorooms-testing`: pruebas unitarias, de arquitectura y de integración con PostgreSQL real (`Testcontainers`).
- `knorooms-database-migrations`: creación, revisión de RLS e inspección de migraciones EF Core.
- `knorooms-code-review`: lista de verificación de seguridad, multi-tenancy, rendimiento y estilo antes de entregar cambios.

## 8. Alcance vigente y prioridad de implementación
Antes de planificar nuevas funcionalidades, leer:
- [Alcance del producto](docs/product/scope.md).
- [Secuencia y criterios de aceptación](docs/product/implementation-roadmap.md).
- [Arquitectura SaaS y Moodle](docs/architecture/saas-administration-and-moodle.md).
- [ADR-0005](docs/decisions/0005-school-saas-and-moodle-scope.md).

Estos documentos gobiernan el alcance futuro frente a las propuestas Word preliminares. El código refleja el estado implementado, no elimina requisitos pendientes. Conservar los ADR técnicos previos salvo sustitución explícita.

- Moodle es opcional por colegio, pero su integración pertenece al producto y al plan de implementación.
- No confundir módulos de código con módulos comerciales habilitados por colegio.
- Subscriptions y Entitlements están implementados (orden 3); Integrations/Moodle sigue pendiente del orden 4.
- No avanzar a universidades ni sustituir la administración SaaS por más pantallas académicas.
- No afirmar que conexión, suscripción, importación o publicación funcionan sin implementación y pruebas.
- No publicar boletas desde la sincronización ni deducir aprobación escolar contando cursos externos.
- El orden 1 es documental. El orden 2 está implementado con pruebas automatizadas; consultar docs/architecture/institution-setup-and-invitations.md. El orden 3 implementa suscripciones y derechos; consultar docs/architecture/subscriptions-and-entitlements.md. La siguiente etapa prevista es el orden 4, sin iniciarla por implicación.

## Actualización prioritaria: ADR-0006 (22/10/2026)
El flujo vigente configura módulos directamente por institución, sin planes en la UI. Leer docs/architecture/institution-management.md y docs/decisions/0006-direct-institution-modules-and-resend.md antes de continuar. Resend es proveedor de correo predeterminado; SMTP/Mailpit es un modo explícito local. Las políticas de PlatformDirectory solo permiten metadatos de lectura, nunca datos académicos ni escrituras. La superficie de soporte temporal se mantiene oculta. Conservar datos/contratos históricos; no reintroducir planes ni soporte en la interfaz por seguir textos antiguos.

## Interfaz aprobada el 23/10/2026
Leer docs/design/administration-global.md. El HTML del propietario gobierna la presentación de la administración global; Dashboard e Instituciones son sus entradas. Mantener fuente del sistema, Tailwind propio y separación de presentación, hooks y API. Esta navegación sustituye la indicación anterior de mostrar únicamente Instituciones.
