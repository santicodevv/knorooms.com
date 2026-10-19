# ADR-0002: Multi-Tenancy en Esquema Compartido con PostgreSQL RLS Forzado y Claves Compuestas

- **Estado:** Aceptado
- **Fecha:** 2026-10-19

## Contexto

KNOROOMS atiende a múltiples instituciones educativas desde una base PostgreSQL compartida. Un error de filtrado en una consulta no debe exponer jamás expedientes estudiantiles ni calificaciones de otro colegio, ni siquiera ante consultas administrativas globales.

## Decisión

1. Utilizar un esquema compartido (`public`) con columna `tenant_id` (`UUID`) obligatoria en todas las tablas institucionales.
2. Ejecutar la aplicación bajo el rol `knorooms_app` con `NOSUPERUSER` y `NOBYPASSRLS`.
3. Activar `ENABLE ROW LEVEL SECURITY` y `FORCE ROW LEVEL SECURITY` en todas las tablas institucionales.
4. No otorgar bypass global en tablas académicas (`students`, `academic_*`, `student_enrollments`, `attendance_records`, `grade_entries`, `report_card_snapshots`): sus políticas RLS exigen `app_execution_mode() = 'tenant' AND tenant_id = app_current_tenant_id()`.
5. Sincronizar `app.current_tenant_id`, `app.current_user_id` y `app.execution_mode` mediante `PostgresRlsInterceptor` usando `set_config(..., is_local => true)` en transacciones y limpieza explícita al cerrar conexiones del pool.
6. Definir claves candidatas `(tenant_id, id)` y claves foráneas compuestas `(tenant_id, <fk>_id)` en todas las relaciones institucionales.

## Consecuencias

- Aislamiento garantizado simultáneamente por la aplicación (EF Core Query Filters) y por el motor de base de datos (PostgreSQL RLS + FKs compuestas).
