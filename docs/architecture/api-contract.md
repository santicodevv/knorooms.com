# Contrato HTTP inicial (API ↔ BFF)

Contrato de los endpoints fundacionales. La API es **interna**: solo la consume el BFF de Next.js
(servidor a servidor). El navegador nunca recibe tokens ni llama directamente a la API.

## Convenciones

- Base: `API_BASE_URL` (local: `http://localhost:5080`). Todas las rutas empiezan por `/api`.
- JSON en `camelCase`. Fechas ISO-8601 en UTC. Identificadores UUID.
- Errores: `application/problem+json` (RFC 9457) con `title`, `status`, `detail`, `traceId` y,
  en validaciones, `errors: { campo: [mensajes] }`.
- Autenticación: `Authorization: Bearer <access_token>` (JWT HS256 emitido por el backend de KNOROOMS).
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

## Asistencia Escolar Diaria (host `{slug}.*`, `/api/tenant/attendance/*`)

| Método y ruta | Permiso | Cuerpo | Respuesta |
| --- | --- | --- | --- |
| `GET /api/tenant/attendance?academicYearId=&sectionId=&attendanceDate=` | `institution.attendance.read` | — | `SectionAttendanceOverviewDto` |
| `POST /api/tenant/attendance/batch` | `institution.attendance.record` | `{ "sectionId", "attendanceDate", "entries": [{ "enrollmentId", "status", "justificationNote" }] }` | 200 `AttendanceBatchRecordResultDto` |

## Políticas de Evaluación y Calificaciones (host `{slug}.*`, `/api/tenant/grading/*`)

| Método y ruta | Permiso | Cuerpo | Respuesta |
| --- | --- | --- | --- |
| `GET /api/tenant/grading?academicYearId=&sectionId=&subjectId=&periodCode=` | `institution.grading.read` | — | `GradingWorkspaceOverviewDto` |
| `POST /api/tenant/grading/policies` | `institution.grading.approve` | `{ "academicYearId", "policyCode", "versionNumber", "name", "minPassingScore", "enabledPeriods", "notes", "isValidatedWithPilotSchool" }` | 201 `EvaluationPolicyVersionDto` |
| `POST /api/tenant/grading/entries/batch` | `institution.grading.record` | `{ "sectionId", "subjectId", "evaluationPolicyVersionId", "periodCode", "grades": [{ "enrollmentId", "numericScore", "correctionReason" }] }` | 200 `GradesBatchRecordResultDto` |
| `POST /api/tenant/grading/entries/{gradeEntryId}/approve` | `institution.grading.approve` | — | 200 `GradeEntryDto` (valida separación de funciones) |

## Boletines Académicos Inmutables (host `{slug}.*`, `/api/tenant/report-cards/*`)

| Método y ruta | Permiso | Cuerpo | Respuesta |
| --- | --- | --- | --- |
| `GET /api/tenant/report-cards?academicYearId=&sectionId=&periodCode=` | `institution.report-cards.read` | — | `ReportCardsOverviewDto` |
| `POST /api/tenant/report-cards/publish` | `institution.report-cards.publish` | `{ "enrollmentId", "evaluationPolicyVersionId", "periodCode", "correctionReason" }` | 201 `ReportCardSnapshotDto` (v1 inicial o vN+1 rectificado con motivo >= 10 caracteres) |


## Ficha e invitaciones de administradores (orden 2)
| Método y ruta | Autorización | Resultado |
|---|---|---|
| GET /api/platform/institutions/{id}/setup | PlatformInstitutionsRead | Perfil, administradores, últimas 50 invitaciones, tareas y porcentaje administrativo. |
| PUT /api/platform/institutions/{id}/profile | PlatformInstitutionsManage | Perfil actualizado; requiere version vigente, 409 si cambió. |
| POST /api/platform/institutions/{id}/invitations | PlatformInstitutionsManage | Body { email }; 201 con estado, sin código de aceptación; 409 si SMTP/clave no están configurados o colegio suspendido. |
| POST /api/platform/institutions/{id}/invitations/{invitationId}/revoke | PlatformInstitutionsManage | 204; 409 si no está disponible en ese colegio. |
| POST /api/invitations/accept | Público, solo host institucional; código y contraseña | Body { invitationId, token, displayName, password }; 204 sin sesión/tokens. 400/403 según validación; 429 por exceso de intentos. |

Profile: name, contactName, contactEmail, phone, address, centerCode, logoUrl, timeZoneId, onboardingOwner, welcomeMeetingCompleted, onboardingNotes y version. No modifica slug ni id.

El navegador acepta por POST /api/auth/accept-invitation del BFF, con Origin validado y cuerpo validado. No usa el proxy autenticado ni entrega JWT al navegador. Tras aceptar, el usuario inicia sesión por el flujo habitual.
[Configuración SMTP y operación](institution-setup-and-invitations.md).

## Suscripciones y derechos (orden 3)
| Método | Ruta | Permiso |
|---|---|---|
| GET | /api/platform/plans | platform.institutions.read |
| POST | /api/platform/plans | platform.institutions.manage |
| GET | /api/platform/product-modules | platform.institutions.read |
| GET | /api/platform/institutions/{id}/subscription | platform.institutions.read |
| PUT | /api/platform/institutions/{id}/subscription | platform.institutions.manage |
| GET | /api/tenant/capabilities | institution.context.read |

Crear plan: code, name, description, revision, price/currency opcionales, billingPeriod (Monthly/Annual/Custom), maxActiveStudents/maxSections opcionales y modules. Código+versión únicos; dependencias obligatorias. Respuesta 201 con versión inmutable.

Asignar: planVersionId, startsAtUtc, endsAtUtc, status (Active/Suspended/Cancelled), reason, overrides [{code, enabled}], version. La versión de concurrencia es null en el alta y la devuelta por GET en actualizaciones. Overrides reemplaza la selección completa; [] hereda todo del plan. Respuesta 200 con Subscription, Plan y Access efectivos; 409 si cambió la versión.

Capabilities devuelve estado efectivo, fin, límites y módulos (canRead/canWrite/reason), sin precios ni motivos privados del operador. No concede permisos. Las escrituras académicas restringidas devuelven 403 ProblemDetails con Entitlement.ReadOnly, Entitlement.StudentLimit o Entitlement.SectionLimit. Consulta histórica sujeta a permisos originales.

## Gestión directa de instituciones (ADR-0006)
| Método | Ruta | Permiso |
|---|---|---|
| GET | /api/platform/institution-management | platform.institutions.read |
| GET | /api/platform/institution-management/slug-availability?slug=... | platform.institutions.read |
| POST | /api/platform/institution-management | platform.institutions.manage |
| GET | /api/platform/institution-management/{id}/modules | platform.institutions.read |
| PUT | /api/platform/institution-management/{id}/modules | platform.institutions.manage |
| POST | /api/platform/institutions/{id}/invitations/{invitationId}/resend | platform.institutions.manage |

Listado: search (máximo 200), status (Active/Suspended), administrator (None/Pending/Expired/Failed/Active), page >= 1 y pageSize 10/25/50. Respuesta {items,total,page,pageSize}; nombre + UUID como orden estable; páginas fuera de rango se ajustan a la última disponible.

Alta: {name,slug,contactEmail,contactName,phone,address,logoUrl,timeZoneId,enabledModules}. Nombre, slug y correo de contacto obligatorios. Guarda perfil, roles y módulos en una transacción; devuelve 201 InstitutionDto. Sin plan. Error de slug duplicado 409.

Módulos: PUT {enabledModules,version}; versión null solo en la primera configuración. Respuesta {enabledModules,version,access}; 409 ante versión obsoleta y 400 ante módulos/dependencias inválidas. Desactivar conserva datos.

Invitar al mismo correo con invitación pendiente devuelve el mismo ID sin otro envío. Reenviar invalida el ID anterior; devuelve 201 con nueva invitación, o 409 si la anterior cambió. Las invitaciones continúan sin exponer códigos ni credenciales.

### Dashboard de administración global (23/10/2026)
GET `/api/platform/institution-management/dashboard`: contexto Platform y permiso PlatformInstitutionsRead. Devuelve totales de instituciones activas/suspendidas, estados del administrador, doce puntos mensuales acumulados, uso de módulos disponibles, cinco colegios recientes, cinco acciones administrativas permitidas y generatedAt. Solo metadatos administrativos; nunca actividad académica ni JSON de auditoría. El listado admite `administrator=NotActive`, además de los estados individuales existentes.
