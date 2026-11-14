using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Knorooms.Modules.Common.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261114030000_AddV1InstitutionPermissions")]
public sealed class AddV1InstitutionPermissions : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            INSERT INTO public.permissions (code, name, description, scope, module)
            VALUES
                ('institution.students.create', 'Registrar estudiantes', 'Permite registrar estudiantes en el colegio activo.', 'Institution', 'Students'),
                ('institution.students.update', 'Editar estudiantes', 'Permite editar estudiantes en el colegio activo.', 'Institution', 'Students'),
                ('institution.students.deactivate', 'Desactivar estudiantes', 'Permite desactivar estudiantes en el colegio activo.', 'Institution', 'Students'),
                ('institution.students.medical.read', 'Consultar datos médicos', 'Permite consultar datos médicos en el colegio activo.', 'Institution', 'Students'),
                ('institution.guardians.manage', 'Gestionar responsables', 'Permite gestionar responsables en el colegio activo.', 'Institution', 'Students'),
                ('institution.documents.read', 'Consultar documentos', 'Permite consultar documentos en el colegio activo.', 'Institution', 'Documents'),
                ('institution.documents.manage', 'Gestionar documentos', 'Permite gestionar documentos en el colegio activo.', 'Institution', 'Documents'),
                ('institution.document-types.manage', 'Gestionar tipos de documento', 'Permite gestionar tipos de documento en el colegio activo.', 'Institution', 'Documents'),
                ('institution.imports.run', 'Ejecutar importaciones', 'Permite ejecutar importaciones en el colegio activo.', 'Institution', 'Integrations'),
                ('institution.grading.correct', 'Rectificar calificaciones', 'Permite rectificar calificaciones en el colegio activo.', 'Institution', 'Grading'),
                ('institution.report-cards.rectify', 'Rectificar boletines', 'Permite rectificar boletines en el colegio activo.', 'Institution', 'ReportCards'),
                ('institution.report-cards.export', 'Exportar boletines', 'Permite exportar boletines en el colegio activo.', 'Institution', 'ReportCards'),
                ('institution.reports.read', 'Consultar reportes', 'Permite consultar reportes en el colegio activo.', 'Institution', 'Reports')
            ON CONFLICT (code) DO NOTHING;

            DO $$
            DECLARE school_id uuid;
            BEGIN
                FOR school_id IN SELECT id FROM public.institutions LOOP
                    PERFORM set_config('app.execution_mode', 'platform_onboarding', true);
                    PERFORM set_config('app.current_tenant_id', school_id::text, true);
                    INSERT INTO public.institution_role_permissions (id, tenant_id, role_id, permission_code, created_at_utc)
                    SELECT gen_random_uuid(), school_id, r.id, grants.permission_code, now()
                    FROM public.institution_roles r
                    JOIN (VALUES
                        ('InstitutionAdmin', 'institution.students.create'),
                        ('Registrar', 'institution.students.create'),
                        ('InstitutionAdmin', 'institution.students.update'),
                        ('Registrar', 'institution.students.update'),
                        ('InstitutionAdmin', 'institution.students.deactivate'),
                        ('Registrar', 'institution.students.deactivate'),
                        ('InstitutionAdmin', 'institution.students.medical.read'),
                        ('InstitutionAdmin', 'institution.guardians.manage'),
                        ('Registrar', 'institution.guardians.manage'),
                        ('InstitutionAdmin', 'institution.documents.read'),
                        ('Registrar', 'institution.documents.read'),
                        ('InstitutionAdmin', 'institution.documents.manage'),
                        ('Registrar', 'institution.documents.manage'),
                        ('InstitutionAdmin', 'institution.document-types.manage'),
                        ('InstitutionAdmin', 'institution.imports.run'),
                        ('InstitutionAdmin', 'institution.grading.correct'),
                        ('Principal', 'institution.grading.correct'),
                        ('AcademicCoordinator', 'institution.grading.correct'),
                        ('InstitutionAdmin', 'institution.report-cards.rectify'),
                        ('Principal', 'institution.report-cards.rectify'),
                        ('InstitutionAdmin', 'institution.report-cards.export'),
                        ('Principal', 'institution.report-cards.export'),
                        ('AcademicCoordinator', 'institution.report-cards.export'),
                        ('Registrar', 'institution.report-cards.export'),
                        ('InstitutionAdmin', 'institution.reports.read'),
                        ('Principal', 'institution.reports.read'),
                        ('AcademicCoordinator', 'institution.reports.read')
                    ) AS grants(role_code, permission_code) ON grants.role_code = r.code
                    WHERE r.tenant_id = school_id AND r.is_system_role
                    ON CONFLICT (tenant_id, role_id, permission_code) DO NOTHING;
                END LOOP;
                PERFORM set_config('app.execution_mode', 'none', true);
                PERFORM set_config('app.current_tenant_id', '', true);
            END
            $$;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Se conservan las asignaciones que los colegios hayan configurado.
    }
}
