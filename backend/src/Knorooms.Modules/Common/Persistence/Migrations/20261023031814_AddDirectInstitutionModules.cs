using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Knorooms.Modules.Common.Persistence.Migrations;
/// <inheritdoc />
public partial class AddDirectInstitutionModules : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "institution_module_settings",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                enabled_modules = table.Column<string[]>(type: "text[]", nullable: false),
                max_active_students = table.Column<int>(type: "integer", nullable: true),
                max_sections = table.Column<int>(type: "integer", nullable: true),
                xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_institution_module_settings", x => x.id);
                table.UniqueConstraint("AK_institution_module_settings_tenant_id_id", x => new { x.tenant_id, x.id });
                table.ForeignKey(
                    name: "FK_institution_module_settings_institutions_tenant_id",
                    column: x => x.tenant_id,
                    principalTable: "institutions",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_institution_module_settings_tenant_id",
            table: "institution_module_settings",
            column: "tenant_id",
            unique: true);
        migrationBuilder.Sql(PostgresRlsPolicySql.BuildInstitutionModulesUpSql());
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP POLICY IF EXISTS rls_directory_memberships ON public.tenant_memberships;
            DROP POLICY IF EXISTS rls_directory_membership_roles ON public.tenant_membership_roles;
            DROP POLICY IF EXISTS rls_directory_roles ON public.institution_roles;
            DROP POLICY IF EXISTS rls_directory_invitations ON public.administrator_invitations;
            """);
        migrationBuilder.DropTable(
            name: "institution_module_settings");
    }
}
