# Contrato HTTP inicial (API ↔ BFF)

Contrato de los endpoints fundacionales. La API es **interna**: solo la consume el BFF de Next.js
(servidor a servidor). El navegador nunca recibe tokens ni llama directamente a la API.

## Convenciones

- Base: `API_BASE_URL` (local: `http://localhost:5080`). Todas las rutas empiezan por `/api`.
- JSON en `camelCase`. Fechas ISO-8601 en UTC. Identificadores UUID.
- Errores: `application/problem+json` (RFC 9457) con `title`, `status`, `detail`, `traceId` y,
  en validaciones, `errors: { campo: [mensajes] }`.
- Autenticación: `Authorization: Bearer <access_token OIDC>` emitido por el proveedor configurado.
- Resolución de tenant: el BFF reenvía el host original en `X-Forwarded-Host`
  (p. ej. `colegio-a.localhost:3000`). La API extrae el *slug* del subdominio. El host **no autoriza**:
  la API exige además una membresía activa (o un acceso de soporte aprobado).
- Hosts:
  - `{APP_BASE_DOMAIN}` → sitio público (sin API autenticada).
  - `admin.{APP_BASE_DOMAIN}` → administración global (`/api/platform/*`).
  - `{slug}.{APP_BASE_DOMAIN}` → portal institucional (`/api/tenant/*`).

| Código | Significado |
| --- | --- |
| 401 | Sin token válido. |
| 403 | Autenticado, pero sin membresía/permiso, o MFA requerido (`type` termina en `/mfa-required`). |
| 404 | Tenant inexistente o recurso no visible. |
| 409 | Conflicto (p. ej. slug duplicado). |
| 423 | Institución suspendida. |

## Salud (anónimo)

- `GET /health/live` → 200.
- `GET /health/ready` → 200 si PostgreSQL responde.

## Identidad

### `GET /api/me` (autenticado, cualquier host)

```json
{
  "userId": "uuid",
  "displayName": "Ana Pérez",
  "email": "ana@example.com",
  "platformRoles": ["PlatformAdmin"],
  "memberships": [
    { "membershipId": "uuid", "tenantId": "uuid", "tenantSlug": "colegio-a", "tenantName": "Colegio A", "status": "Active" }
  ]
}
```

## Administración global (host `admin.*`)

| Método y ruta | Permiso | Cuerpo | Respuesta |
| --- | --- | --- | --- |
| `GET /api/platform/institutions` | `platform.institutions.read` | — | `InstitutionDto[]` |
| `GET /api/platform/institutions/{id}` | `platform.institutions.read` | — | `InstitutionDto` |
| `POST /api/platform/institutions` | `platform.institutions.manage` | `{ "slug": "colegio-a", "name": "Colegio A" }` | 201 `InstitutionDto` |
| `POST /api/platform/institutions/{id}/suspend` | `platform.institutions.manage` | — | 204 |
| `POST /api/platform/institutions/{id}/activate` | `platform.institutions.manage` | — | 204 |
| `POST /api/platform/institutions/{id}/administrators` | `platform.institutions.manage` | `{ "email": "director@colegio-a.edu.do" }` | 201 `{ "membershipId": "uuid" }` |
| `POST /api/platform/support-access-requests` | `platform.support.request-access` | `{ "tenantId", "reason", "permissions": ["institution.members.read"], "durationMinutes": 240 }` | 201 `SupportAccessGrantDto` |

`InstitutionDto`: `{ "id", "slug", "name", "status": "Active" | "Suspended", "createdAt" }`.

El usuario indicado en `administrators` debe haber iniciado sesión al menos una vez (aprovisionamiento JIT).

## Portal institucional (host `{slug}.*`)

### `GET /api/tenant/context` (miembro activo o soporte con acceso aprobado)

```json
{
  "tenant": { "id": "uuid", "slug": "colegio-a", "name": "Colegio A", "status": "Active" },
  "accessType": "Member",
  "membershipId": "uuid",
  "roles": [{ "id": "uuid", "code": "InstitutionAdmin", "name": "Administrador institucional" }],
  "permissions": ["institution.members.read", "institution.members.manage"],
  "supportAccessExpiresAt": null
}
```

`accessType`: `Member` | `Support`.

| Método y ruta | Permiso | Respuesta |
| --- | --- | --- |
| `GET /api/tenant/members` | `institution.members.read` | `MemberDto[]` |
| `POST /api/tenant/members/{membershipId}/revoke` | `institution.members.manage` | 204 |
| `GET /api/tenant/roles` | `institution.roles.read` | `RoleDto[]` |
| `GET /api/tenant/support-access` | `institution.support-access.read` | `SupportAccessGrantDto[]` |
| `POST /api/tenant/support-access/{id}/approve` | `institution.support-access.manage` | 204 |
| `POST /api/tenant/support-access/{id}/reject` | `institution.support-access.manage` | 204 |
| `POST /api/tenant/support-access/{id}/revoke` | `institution.support-access.manage` | 204 |
| `GET /api/tenant/audit-logs?limit=50` | `institution.audit.read` | `AuditLogEntryDto[]` |

- `MemberDto`: `{ "membershipId", "userId", "displayName", "email", "status": "Active" | "Revoked", "roles": ["InstitutionAdmin"], "createdAt" }`.
- `RoleDto`: `{ "id", "code", "name", "isSystem", "permissions": ["..."] }`.
- `SupportAccessGrantDto`: `{ "id", "tenantId", "requestedByUserId", "reason", "permissions": [], "durationMinutes", "status": "Requested" | "Approved" | "Rejected" | "Revoked", "requestedAt", "approvedAt", "expiresAt", "revokedAt" }`.

## Estructura Académica Institucional (host `{slug}.*`, `/api/tenant/academic/*`)

| Método y ruta | Permiso | Cuerpo | Respuesta |
| --- | --- | --- | --- |
| `GET /api/tenant/academic/overview` | `institution.academic.read` | — | `AcademicStructureOverviewDto` |
| `GET /api/tenant/academic/years` | `institution.academic.read` | — | `AcademicYearDto[]` |
| `POST /api/tenant/academic/years` | `institution.academic.manage` | `{ "code", "name", "startDate", "endDate" }` | 201 `AcademicYearDto` |
| `POST /api/tenant/academic/years/{id}/close` | `institution.academic.manage` | — | 204 |
| `POST /api/tenant/academic/years/{id}/reopen` | `institution.academic.manage` | — | 204 |
| `GET /api/tenant/academic/grade-levels` | `institution.academic.read` | — | `GradeLevelDto[]` |
| `POST /api/tenant/academic/grade-levels` | `institution.academic.manage` | `{ "stage", "officialGradeNumber", "code", "displayName" }` | 201 `GradeLevelDto` |
| `GET /api/tenant/academic/sections` | `institution.academic.read` | — | `SchoolSectionDto[]` |
| `POST /api/tenant/academic/sections` | `institution.academic.manage` | `{ "academicYearId", "gradeLevelId", "code", "shift", "capacity" }` | 201 `SchoolSectionDto` |
| `GET /api/tenant/academic/subjects` | `institution.academic.read` | — | `SubjectDto[]` |
| `POST /api/tenant/academic/subjects` | `institution.academic.manage` | `{ "code", "name" }` | 201 `SubjectDto` |
| `GET /api/tenant/academic/teacher-assignments` | `institution.academic.read` | — | `TeacherAssignmentDto[]` |
| `POST /api/tenant/academic/teacher-assignments` | `institution.academic.manage` | `{ "sectionId", "subjectId", "teacherMembershipId", "weeklyHours" }` | 201 `TeacherAssignmentDto` |

## Expedientes Estudiantiles y Tutores (host `{slug}.*`, `/api/tenant/students/*`)

| Método y ruta | Permiso | Cuerpo | Respuesta |
| --- | --- | --- | --- |
| `GET /api/tenant/students/overview` | `institution.students.read` | — | `StudentDirectoryOverviewDto` |
| `GET /api/tenant/students` | `institution.students.read` | — | `StudentDto[]` |
| `POST /api/tenant/students` | `institution.students.manage` | `{ "studentCode", "firstName", "lastName", "birthDate", "sigerdExternalId" }` | 201 `StudentDto` |
| `POST /api/tenant/students/{id}/deactivate` | `institution.students.manage` | — | 204 |
| `POST /api/tenant/students/{id}/activate` | `institution.students.manage` | — | 204 |
| `GET /api/tenant/students/guardians` | `institution.students.read` | — | `GuardianDto[]` |
| `POST /api/tenant/students/guardians` | `institution.students.manage` | `{ "fullName", "email", "phoneNumber" }` | 201 `GuardianDto` |
| `POST /api/tenant/students/{studentId}/guardians` | `institution.students.manage` | `{ "guardianId", "relationshipType", "hasAcademicAccess", "hasFinancialResponsibility", "hasPickupAuthorization" }` | 201 `StudentGuardianSummaryDto` |

## Matrículas por Año Escolar y Cupos de Aula (host `{slug}.*`, `/api/tenant/enrollments/*`)

| Método y ruta | Permiso | Cuerpo | Respuesta |
| --- | --- | --- | --- |
| `GET /api/tenant/enrollments/overview` | `institution.enrollments.read` | — | `EnrollmentsOverviewDto` |
| `GET /api/tenant/enrollments` | `institution.enrollments.read` | — | `StudentEnrollmentDto[]` |
| `POST /api/tenant/enrollments` | `institution.enrollments.manage` | `{ "studentId", "sectionId" }` | 201 `StudentEnrollmentDto` (valida cupo disponible en sección) |
| `POST /api/tenant/enrollments/{id}/transfer-section` | `institution.enrollments.manage` | `{ "targetSectionId" }` | 200 `StudentEnrollmentDto` |
| `POST /api/tenant/enrollments/{id}/withdraw` | `institution.enrollments.manage` | — | 204 (libera cupo en sección) |


