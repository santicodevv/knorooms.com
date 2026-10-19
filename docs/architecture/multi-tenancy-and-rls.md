# Multi-Tenancy, Row-Level Security (RLS) y Modelo de Datos

## 1. Estrategia Multi-Tenant de Defensa en Profundidad

KNOROOMS implementa aislamiento multi-tenant en **cuatro capas complementarias**:

1. **Identificación por subdominio (`HostSubdomainParser` + `TenantAndIdentityResolutionMiddleware`)**:
   - `knorooms.com` / `localhost:3000` → `TenantHostKind.Public`
   - `admin.knorooms.com` / `admin.localhost:3000` → `TenantHostKind.Platform`
   - `{slug}.knorooms.com` / `{slug}.localhost:3000` → `TenantHostKind.Institution`
   - Cualquier intento del cliente de enviar `X-Tenant-Id` o `?tenantId=` es rechazado con `400 Bad Request`.
2. **Autorización por membresía o soporte aprobado (`ITenantAuthorizationService`)**:
   - El subdominio **identifica** el colegio solicitado, pero **nunca autoriza** al usuario.
   - El usuario autenticado debe poseer una `TenantMembership` en estado `Active` en ese colegio, o una concesión `SupportAccessGrant` en estado `Approved` y no expirada/revocada.
3. **Filtros globales y validación de escritura en EF Core (`ApplicationDbContext`)**:
   - Todas las entidades `ITenantScopedEntity` tienen `HasQueryFilter(e => CurrentTenantId != null && e.TenantId == CurrentTenantId)`.
   - `SaveChangesAsync` verifica que ninguna entidad institucional añadida, modificada o eliminada tenga `TenantId` vacío o distinto al `TenantId` activo.
4. **Row-Level Security (RLS) forzado en PostgreSQL (`PostgresRlsPolicySql` + `PostgresRlsInterceptor`)**:
   - El rol de aplicación `knorooms_app` se crea con `NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS`.
   - Todas las tablas institucionales ejecutan `ENABLE ROW LEVEL SECURITY` y `FORCE ROW LEVEL SECURITY`.
   - **Sin bypass indiscriminado para administradores globales**: las 13 tablas académicas y de expedientes (`students`, `guardians`, `student_guardian_links`, `academic_years`, `grade_levels`, `school_sections`, `subjects`, `teacher_assignments`, `student_enrollments`, `attendance_records`, `evaluation_policy_versions`, `grade_entries`, `report_card_snapshots`) exigen estrictamente `app_execution_mode() = 'tenant' AND tenant_id = app_current_tenant_id()`. Ni siquiera `app_execution_mode() = 'platform'` devuelve filas en esas tablas.

---

## 2. Manejo de Conexiones del Pool, Consultas y Transacciones (`PostgresRlsInterceptor`)

Para evitar fugas de contexto en conexiones reutilizadas del pool de Npgsql y garantizar consistencia tanto en lecturas como en transacciones:

- Cuando existe una transacción activa (`command.Transaction != null`, lo cual incluye todo `SaveChangesAsync`), el interceptor ejecuta:
  ```sql
  SELECT
      set_config('app.current_tenant_id', @tenant_id, true),
      set_config('app.current_user_id', @user_id, true),
      set_config('app.execution_mode', @mode, true);
  ```
  El tercer parámetro `true` (`is_local`) vincula los valores exclusivamente a la transacción actual de PostgreSQL, revirtiéndolos automáticamente al hacer `COMMIT` o `ROLLBACK`.
- En lecturas sin transacción explícita, el interceptor sincroniza el contexto antes de ejecutar el comando si difiere del estado aplicado en la conexión, y al cerrar la conexión (`ConnectionClosing` / `ConnectionClosingAsync`) restablece explícitamente `app.current_tenant_id = ''`, `app.current_user_id = ''` y `app.execution_mode = 'none'` antes de que regrese al pool.

---

## 3. Integridad Referencial entre Colegios (Claves Compuestas)

Todas las tablas institucionales padre definen una clave alternativa compuesta `(tenant_id, id)` (`HasAlternateKey(x => new { x.TenantId, x.Id })`), y todas las tablas hijas referencian a sus padres mediante **claves foráneas compuestas `(tenant_id, <parent>_id)`**:

- `student_enrollments (tenant_id, student_id)` → `students (tenant_id, id)`
- `student_enrollments (tenant_id, academic_year_id)` → `academic_years (tenant_id, id)`
- `student_enrollments (tenant_id, section_id)` → `school_sections (tenant_id, id)`
- `tenant_membership_roles (tenant_id, membership_id)` → `tenant_memberships (tenant_id, id)`
- `tenant_membership_roles (tenant_id, role_id)` → `institution_roles (tenant_id, id)`
- `grade_entries`, `attendance_records`, `report_card_snapshots`, `teacher_assignments` siguen el mismo patrón.

Esto hace físicamente imposible en PostgreSQL relacionar registros de dos colegios distintos.
