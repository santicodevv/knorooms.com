# AGENTS.md — Guía Maestra para Agentes de IA en KNOROOMS

## 1. Qué es KNOROOMS

**KNOROOMS** es una plataforma SaaS multi-tenant de gestión académica dirigida inicialmente a colegios de República Dominicana (Primaria y Secundaria bajo lineamientos del MINERD) y diseñada para expandirse a educación superior (MESCyT).

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
- **Next.js 16 (App Router)** con **TypeScript estricto**, **Tailwind CSS v4** y **shadcn/ui**.
- Actúa como **Backend for Frontend (BFF)**: implementa **Authorization Code Flow con PKCE (`S256`)** mediante `openid-client`, sesiones en servidor sobre **Redis** cifradas con **AES-256-GCM**, cookies `HttpOnly` host-only y protección **CSRF** (`X-CSRF-Token` + validación `Origin`).

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
│   │   └── Knorooms.Api/            # Host HTTP, OIDC Bearer, middlewares, Controllers
│   └── tests/
│       ├── Knorooms.UnitTests/      # Pruebas de dominio, subdominios y NetArchTest
│       └── Knorooms.IntegrationTests/ # Pruebas PostgreSQL 17 real (Testcontainers) y RLS
├── infrastructure/
│   └── docker/                      # Docker Compose (PostgreSQL 17, Redis 7.4, Keycloak opcional)
├── .editorconfig
├── .gitignore
├── .gitattributes
├── .env.example
└── README.md
```

### Los 12 Módulos de `Knorooms.Modules`
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
   - Jamás guardar `access_token`, `refresh_token` ni `id_token` en `localStorage`, `sessionStorage` ni cookies legibles por JavaScript.

---

## 5. Lo que los Agentes NUNCA Deben Hacer

- **NO** introducir microservicios ni dividir el backend en múltiples despliegues sin autorización explícita.
- **NO** crear nuevos proyectos `.csproj` por cada módulo.
- **NO** desactivar, omitir ni debilitar políticas RLS o ejecutar la API con un rol PostgreSQL que tenga `BYPASSRLS` o `SUPERUSER`.
- **NO** aceptar `TenantId` desde query string, body o cabeceras del cliente para seleccionar el colegio activo.
- **NO** implementar autenticación casera con contraseñas locales ni emisores JWT propios en producción.
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

---

## 7. Skills Locales Disponibles (`.agents/skills/`)

Antes de realizar cambios en un área especializada, lee la Skill correspondiente en `.agents/skills/<nombre>/SKILL.md`:

- `knorooms-architecture`: límites del monolito modular, contratos y pruebas NetArchTest.
- `knorooms-backend-dotnet`: desarrollo de Controllers, servicios de aplicación, `Result<T>`, FluentValidation y ProblemDetails.
- `knorooms-efcore-postgresql`: configuraciones Fluent API, claves compuestas `(tenant_id, id)`, índices y concurrencia.
- `knorooms-multi-tenancy`: resolución por subdominio, `ITenantContextAccessor`, `PostgresRlsInterceptor` y políticas RLS.
- `knorooms-security-auth`: OIDC + PKCE, BFF con Redis AES-256-GCM, CSRF, RBAC/ABAC, MFA y soporte temporal.
- `knorooms-frontend-nextjs`: App Router, `src/proxy.ts`, layouts por subdominio, Server/Client Components y `shadcn/ui`.
- `knorooms-module-development`: guía paso a paso para ampliar o crear casos de uso dentro de los 12 módulos.
- `knorooms-testing`: pruebas unitarias, de arquitectura y de integración con PostgreSQL real (`Testcontainers`).
- `knorooms-database-migrations`: creación, revisión de RLS e inspección de migraciones EF Core.
- `knorooms-code-review`: lista de verificación de seguridad, multi-tenancy, rendimiento y estilo antes de entregar cambios.
