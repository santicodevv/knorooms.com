# KNOROOMS — Plataforma SaaS Multi-Tenant de Gestión Académica

[![KNOROOMS CI](https://github.com/santicodevv/knorooms.com/actions/workflows/ci.yml/badge.svg)](https://github.com/santicodevv/knorooms.com/actions/workflows/ci.yml)

**KNOROOMS** es una plataforma SaaS multi-tenant para **colegios y escuelas de República Dominicana**. El alcance incluye administración global de colegios, suscripciones, habilitación de módulos e integración opcional con Moodle por colegio. La implementación es parcial; educación superior queda fuera de la primera versión y no se presume integración oficial con SIGERD ni cumplimiento normativo sin validación.

---


## Continuar el desarrollo

Lee [CONTINUIDAD.md](CONTINUIDAD.md) para conocer el estado implementado, pendientes, decisiones, arranque local, pruebas y precauciones para retomar con otra IA o por tu cuenta.

**¿Te incorporas al equipo?** Empieza por [docs/SCRUM.md §10](docs/SCRUM.md#10-guía-para-el-equipo): accesos, flujo diario con Jira y GitHub, revisión de código y solución de problemas.

## Flujo vigente de instituciones

[Gestión directa de instituciones](docs/architecture/institution-management.md): listado paginado, creación en tres pasos, módulos por colegio sin seleccionar planes, ficha por pestañas e invitación contextual mediante Resend. [ADR-0006](docs/decisions/0006-direct-institution-modules-and-resend.md) actualiza las decisiones comerciales previas. Moodle sigue pendiente de implementación.

## Alcance vigente y próxima entrega
- [Alcance del producto](docs/product/scope.md): usuarios, estructura escolar, Moodle y límites de la primera versión.
- [Plan de implementación](docs/product/implementation-roadmap.md): etapas y criterios de aceptación.
- [Arquitectura SaaS y Moodle](docs/architecture/saas-administration-and-moodle.md): responsabilidades, autoridad de datos y sincronización.
- [ADR-0005](docs/decisions/0005-school-saas-and-moodle-scope.md): decisión de enfoque.

El orden 1 actualiza documentación. El orden 2 incorpora la ficha del colegio, invitaciones al administrador por SMTP y seguimiento de implementación inicial; ver [guía de operación](docs/architecture/institution-setup-and-invitations.md). El orden 3 incorpora [planes, suscripciones y derechos por módulo](docs/architecture/subscriptions-and-entitlements.md). Moodle sigue pendiente de la etapa 4. Los documentos Word de la raíz se conservan como antecedentes.
## 1. Resumen de Arquitectura

KNOROOMS implementa un **Monolito Modular** con defensa en profundidad para el aislamiento multi-tenant:

| Capa | Tecnología | Responsabilidad |
| :--- | :--- | :--- |
| **Frontend + BFF** | Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4, componentes propios con Tailwind CSS | Enrutamiento por subdominio (`src/proxy.ts`), Backend for Frontend (BFF), formulario de login propio, sesiones cifradas (AES-256-GCM) en Redis, cookies `HttpOnly` host-only, protección CSRF y arquitectura Feature-Sliced (`schemas/`, `api/`, `hooks/`, `components/`). |
| **Backend API** | ASP.NET Core Web API (.NET 10 LTS), C#, FluentValidation, OpenAPI | Controladores REST delgados, credenciales locales (PBKDF2-HMAC-SHA256) y emisión/validación de JWT propios (HS256), resolución de tenant e identidad, autorización RBAC + ABAC con denegación por defecto y respuestas `ProblemDetails` (RFC 9457). |
| **Módulos de Dominio** | `Knorooms.Modules` + `Knorooms.SharedKernel` | 12 módulos lógicos (`Tenants`, `Identity`, `Authorization`, `SupportAccess`, `Audit`, `Platform`, `Students`, `Academic`, `Enrollments`, `Attendance`, `Grading`, `ReportCards`), contratos síncronos y **Transactional Outbox** (`outbox_messages`). |
| **Persistencia y Aislamiento** | PostgreSQL 17 + Entity Framework Core 10 (`Npgsql`) | Base de datos y esquema (`public`) compartidos, `TenantId` (`UUID`), **Row-Level Security (`ENABLE` + `FORCE ROW LEVEL SECURITY`)**, rol de aplicación `knorooms_app` con `NOBYPASSRLS`, filtros globales de EF Core y claves foráneas compuestas `(tenant_id, <fk>_id)`. |

### Identificación por Subdominio
- `knorooms.com` (`localhost:3000`) → Sitio público.
- `admin.knorooms.com` (`admin.localhost:3000`) → Consola de administración global de plataforma.
- `<colegio>.knorooms.com` (`colegio-a.localhost:3000`) → Portal institucional del colegio.

> **Invariante crítica de seguridad:** El subdominio únicamente identifica el tenant solicitado; **nunca autoriza al usuario**. Todo acceso institucional exige membresía activa en el colegio o una solicitud de soporte temporal (`SupportAccessRequest`) aprobada por la institución, vigente y auditada.

---

## 2. Estructura del Repositorio

```text
knorooms.com/
├── AGENTS.md                           # Guía operativa maestra para agentes de IA (raíz)
├── .agents/
│   └── skills/                         # 10 Skills especializadas del proyecto KNOROOMS
├── .github/
│   └── workflows/
│       └── ci.yml                      # Pipeline CI (Backend .NET 10 + PostgreSQL 17 + Frontend Next.js 16)
├── apps/
│   └── web/                            # Aplicación Next.js 16 (App Router) + BFF
│       ├── AGENTS.md                   # Instrucciones de agentes para Frontend y BFF
│       ├── .env.example                # Variables de entorno de ejemplo del BFF
│       └── src/
│           ├── app/                    # Rutas App Router (público, /platform, /school, /api/auth, /api/bff)
│           ├── components/             # Primitivas componentes propios con Tailwind CSS (ui/) y bloques reutilizables (shared/)
│           ├── features/               # Módulos desacoplados (auth, platform, school: schemas, api, hooks, components)
│           ├── lib/                    # BFF, sesiones Redis AES-256-GCM, CSRF, host parser
│           └── proxy.ts                # Enrutamiento multi-tenant por subdominio (Next.js 16)
├── backend/
│   ├── AGENTS.md                       # Instrucciones de agentes para Backend .NET y PostgreSQL RLS
│   ├── Directory.Build.props           # Configuración común (.NET 10, Nullable, analizadores)
│   ├── Knorooms.slnx                   # Solución .NET 10
│   ├── src/
│   │   ├── Knorooms.SharedKernel/      # Primitivas compartidas (Entity, TenantEntity, Result, Permisos)
│   │   ├── Knorooms.Modules/           # 12 módulos, ApplicationDbContext, PostgresRlsInterceptor y Migraciones
│   │   └── Knorooms.Api/               # Host ASP.NET Core, Controllers, Middlewares y Validaciones
│   └── tests/
│       ├── Knorooms.UnitTests/         # Pruebas unitarias y de arquitectura modular (NetArchTest)
│       └── Knorooms.IntegrationTests/  # Pruebas reales con PostgreSQL 17 (Testcontainers) de RLS y API
├── docs/
│   ├── architecture/                   # Documentación de arquitectura, multi-tenancy RLS, seguridad y API
│   └── decisions/                      # Architecture Decision Records (ADRs 0001, 0002, 0003, 0004)
├── infrastructure/
│   └── docker/
│       ├── docker-compose.yml          # PostgreSQL 17 y Redis 7.4
│       ├── postgres/init/              # Inicialización de roles knorooms_migrator y knorooms_app (NOBYPASSRLS)
├── .editorconfig
├── .env.example
├── .gitattributes
├── .gitignore
└── README.md
```

---

## 3. Requisitos Previos

- **.NET SDK 10.0 LTS** (`10.0.100` o superior) + herramienta `dotnet-ef`.
- **Node.js 22 LTS** y **pnpm 10+**.
- **Docker Desktop** (o Docker Engine + Docker Compose v2) en ejecución para PostgreSQL 17, Redis 7 y para ejecutar las pruebas de integración con Testcontainers.

---

## 4. Configuración Local Paso a Paso

### 4.1. Variables de entorno
Copia los archivos de ejemplo (no contienen secretos reales de producción):

```powershell
Copy-Item .env.example .env
Copy-Item apps/web/.env.example apps/web/.env.local
```

### 4.2. Levantar infraestructura local (PostgreSQL 17 y Redis 7)
```powershell
docker compose -f infrastructure/docker/docker-compose.yml up -d postgres redis
```
> El contenedor de PostgreSQL ejecuta automáticamente [`01-init-roles.sql`](./infrastructure/docker/postgres/init/01-init-roles.sql), creando el rol de migraciones (`knorooms_migrator`) y el rol de ejecución de la aplicación (`knorooms_app` con `NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS`).

### 4.3. Aplicar migraciones de base de datos y políticas RLS
Desde la raíz del repositorio:
```powershell
dotnet ef database update --project backend/src/Knorooms.Modules/Knorooms.Modules.csproj --startup-project backend/src/Knorooms.Api/Knorooms.Api.csproj --connection "Host=localhost;Port=5432;Database=knorooms;Username=knorooms_migrator;Password=knorooms_local_dev_migrator"
```

### 4.4. Ejecutar el Backend (`Knorooms.Api`)
```powershell
dotnet run --project backend/src/Knorooms.Api/Knorooms.Api.csproj
```
- API escuchando en `http://localhost:5080`.
- Health checks: `http://localhost:5080/health/live` y `http://localhost:5080/health/ready`.
- Documento OpenAPI (en `Development`): `http://localhost:5080/openapi/v1.json`.

### 4.5. Ejecutar el Frontend + BFF (`apps/web`)
```powershell
pnpm --dir apps/web install
pnpm --dir apps/web dev
```
- Sitio público: `http://localhost:3000`
- Consola de plataforma: `http://admin.localhost:3000`
- Portal de colegio de prueba: `http://colegio-a.localhost:3000` y `http://colegio-b.localhost:3000`

---

## 5. Ejecución de Pruebas y Verificación de Calidad

### Backend (.NET 10)
```powershell
# Verificar formato y estilo de código C#
dotnet format backend/Knorooms.slnx --verify-no-changes

# Compilar toda la solución
dotnet build backend/Knorooms.slnx -c Release

# Ejecutar pruebas unitarias y de arquitectura modular (NetArchTest)
dotnet test backend/tests/Knorooms.UnitTests/Knorooms.UnitTests.csproj

# Ejecutar pruebas de integración contra PostgreSQL 17 real (Testcontainers)
dotnet test backend/tests/Knorooms.IntegrationTests/Knorooms.IntegrationTests.csproj
```

### Frontend y BFF (Next.js 16)
```powershell
pnpm --dir apps/web format:check
pnpm --dir apps/web lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web test
pnpm --dir apps/web build
```

---

## 6. Estrategia de Ramas y Convenciones Git

Todo cambio parte de un ticket de Jira del proyecto **KNO**. El proceso completo, la incorporación de integrantes y la solución de problemas están en [docs/SCRUM.md](docs/SCRUM.md) (§10, *Guía para el equipo*) y [CONTRIBUTING.md](CONTRIBUTING.md).

- **Rama principal**: `main`, protegida por un ruleset: solo acepta PR con 1 aprobación y los checks *Backend*, *Frontend* y *Ticket de Jira* en verde.
- **Ramas de trabajo**: `feature/KNO-<n>-<descripcion>`, `fix/KNO-<n>-...`, `chore/KNO-<n>-...`, `test/KNO-<n>-...`, `docs/KNO-<n>-...`.
- **Commits**: Conventional Commits con la clave (`feat(tenants): KNO-12 ...`, `fix(identity): KNO-31 ...`).
- **PR**: título con la clave `KNO-<n>`. Al abrirlo, el ticket pasa solo a *En revisión*; al mergearlo, a *Finalizado*.
- **Regla de idioma**: código, identificadores, clases, tablas y rutas técnicas en **inglés**; documentación, comentarios explicativos, ADRs, Skills e interfaz de usuario en **español**.

---

## 7. Documentación, Agentes y Skills

- **Instrucciones para Agentes**:
  - [`AGENTS.md` (Raíz)](./AGENTS.md)
  - [`backend/AGENTS.md`](./backend/AGENTS.md)
  - [`apps/web/AGENTS.md`](./apps/web/AGENTS.md)
- **Skills Especializadas (`.agents/skills/`)**:
  - [`knorooms-architecture`](./.agents/skills/knorooms-architecture/SKILL.md)
  - [`knorooms-backend-dotnet`](./.agents/skills/knorooms-backend-dotnet/SKILL.md)
  - [`knorooms-efcore-postgresql`](./.agents/skills/knorooms-efcore-postgresql/SKILL.md)
  - [`knorooms-multi-tenancy`](./.agents/skills/knorooms-multi-tenancy/SKILL.md)
  - [`knorooms-security-auth`](./.agents/skills/knorooms-security-auth/SKILL.md)
  - [`knorooms-frontend-nextjs`](./.agents/skills/knorooms-frontend-nextjs/SKILL.md)
  - [`knorooms-module-development`](./.agents/skills/knorooms-module-development/SKILL.md)
  - [`knorooms-testing`](./.agents/skills/knorooms-testing/SKILL.md)
  - [`knorooms-database-migrations`](./.agents/skills/knorooms-database-migrations/SKILL.md)
  - [`knorooms-code-review`](./.agents/skills/knorooms-code-review/SKILL.md)
- **Documentación Arquitectónica y ADRs**:
  - [Visión General y Módulos](./docs/architecture/overview-and-modules.md)
  - [Multi-Tenancy y PostgreSQL RLS](./docs/architecture/multi-tenancy-and-rls.md)
  - [Seguridad, Autenticación Propia, BFF y Operaciones](./docs/architecture/security-auth-and-operations.md)
  - [Contrato HTTP de la API](./docs/architecture/api-contract.md)
  - [ADR-0001: Monolito Modular](./docs/decisions/0001-modular-monolith-dotnet.md)
  - [ADR-0002: PostgreSQL Compartido + RLS](./docs/decisions/0002-multi-tenancy-postgres-rls.md)
  - [ADR-0003: BFF en Next.js y Autorización RBAC + ABAC](./docs/decisions/0003-oidc-bff-and-rbac-abac.md)
  - [ADR-0004: Credenciales Locales y JWT Emitidos por el Backend](./docs/decisions/0004-local-credentials-and-backend-issued-jwt.md)

---

## 8. Configuraciones Externas Pendientes para Producción

1. **Clave de Firma de JWT de Producción**: generar una clave simétrica real (Base64, ≥ 32 bytes) para `Authentication__Tokens__SigningKey` y rotarla periódicamente desde un gestor de secretos.
2. **DNS Wildcard y Certificados TLS**: configurar los registros DNS (`A`/`CNAME`) para `knorooms.com`, `admin.knorooms.com` y `*.knorooms.com` junto con certificados TLS comodín (`*.knorooms.com`).
3. **Gestor de Secretos y Claves**: inyectar en el entorno de despliegue una clave criptográfica real de 32 bytes para `SESSION_ENCRYPTION_KEY` y las contraseñas diferenciadas de `knorooms_migrator` y `knorooms_app` desde un gestor de secretos (AWS Secrets Manager, Azure Key Vault o GitHub Secrets).
4. **Almacenamiento S3-Compatible**: aprovisionar el bucket privado (AWS S3 / Cloudflare R2) para adjuntos de expedientes y boletines PDF firmados.
