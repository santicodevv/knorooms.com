using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Knorooms.Modules.Common.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261113000000_RestrictGuardianPermissions")]
public sealed class RestrictGuardianPermissions : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DO $$
            DECLARE school_id uuid;
            BEGIN
                FOR school_id IN SELECT id FROM public.institutions LOOP
                    PERFORM set_config('app.execution_mode', 'platform_onboarding', true);
                    PERFORM set_config('app.current_tenant_id', school_id::text, true);

                    DELETE FROM public.institution_role_permissions p
                    USING public.institution_roles r
                    WHERE p.tenant_id = school_id
                      AND r.tenant_id = p.tenant_id
                      AND r.id = p.role_id
                      AND r.is_system_role
                      AND r.code = 'Guardian'
                      AND p.permission_code IN (
                          'institution.students.read',
                          'institution.attendance.read',
                          'institution.report-cards.read'
                      );
                END LOOP;

                PERFORM set_config('app.execution_mode', 'none', true);
                PERFORM set_config('app.current_tenant_id', '', true);
            END
            $$;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // La reversión del esquema no vuelve a conceder acceso amplio a expedientes.
    }
}
