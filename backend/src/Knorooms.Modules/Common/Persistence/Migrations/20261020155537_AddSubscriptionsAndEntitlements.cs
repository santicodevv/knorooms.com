using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Knorooms.Modules.Common.Persistence.Migrations;
/// <inheritdoc />
public partial class AddSubscriptionsAndEntitlements : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "plan_versions",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                code = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                revision = table.Column<int>(type: "integer", nullable: false),
                price = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: true),
                billing_period = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                max_active_students = table.Column<int>(type: "integer", nullable: true),
                max_sections = table.Column<int>(type: "integer", nullable: true),
                modules = table.Column<string[]>(type: "text[]", nullable: false),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_plan_versions", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "institution_subscriptions",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                plan_version_id = table.Column<Guid>(type: "uuid", nullable: false),
                starts_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                ends_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_institution_subscriptions", x => x.id);
                table.UniqueConstraint("AK_institution_subscriptions_tenant_id_id", x => new { x.tenant_id, x.id });
                table.ForeignKey(
                    name: "FK_institution_subscriptions_institutions_tenant_id",
                    column: x => x.tenant_id,
                    principalTable: "institutions",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_institution_subscriptions_plan_versions_plan_version_id",
                    column: x => x.plan_version_id,
                    principalTable: "plan_versions",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "subscription_module_overrides",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                subscription_id = table.Column<Guid>(type: "uuid", nullable: false),
                code = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                enabled = table.Column<bool>(type: "boolean", nullable: false),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_subscription_module_overrides", x => x.id);
                table.ForeignKey(
                    name: "FK_subscription_module_overrides_institution_subscriptions_ten~",
                    columns: x => new { x.tenant_id, x.subscription_id },
                    principalTable: "institution_subscriptions",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_institution_subscriptions_plan_version_id",
            table: "institution_subscriptions",
            column: "plan_version_id");

        migrationBuilder.CreateIndex(
            name: "IX_institution_subscriptions_tenant_id",
            table: "institution_subscriptions",
            column: "tenant_id",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_plan_versions_code_revision",
            table: "plan_versions",
            columns: new[] { "code", "revision" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_subscription_module_overrides_tenant_id_code",
            table: "subscription_module_overrides",
            columns: new[] { "tenant_id", "code" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_subscription_module_overrides_tenant_id_subscription_id",
            table: "subscription_module_overrides",
            columns: new[] { "tenant_id", "subscription_id" });
        migrationBuilder.Sql(PostgresRlsPolicySql.BuildCommercialUpSql());
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("DROP POLICY IF EXISTS rls_audit_commercial_insert ON public.audit_logs;");
        migrationBuilder.DropTable(
            name: "subscription_module_overrides");

        migrationBuilder.DropTable(
            name: "institution_subscriptions");

        migrationBuilder.DropTable(
            name: "plan_versions");
    }
}
