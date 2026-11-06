using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Knorooms.Modules.Common.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPrivateStoredFiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ux_tenant_memberships_tenant_user",
                table: "tenant_memberships");

            migrationBuilder.AddUniqueConstraint(
                name: "ak_tenant_memberships_tenant_user",
                table: "tenant_memberships",
                columns: new[] { "tenant_id", "user_id" });

            migrationBuilder.CreateTable(
                name: "stored_files",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    original_file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    content_type = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    size_bytes = table.Column<long>(type: "bigint", nullable: false),
                    sha256 = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    uploaded_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    storage_key = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    deleted_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stored_files", x => x.id);

                    table.UniqueConstraint(
                        "ak_stored_files_tenant_id",
                        x => new { x.tenant_id, x.id });

                    table.ForeignKey(
                        name: "FK_stored_files_institutions_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "institutions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);

                    table.ForeignKey(
                        name: "FK_stored_files_tenant_memberships_tenant_id_uploaded_by_user_~",
                        columns: x => new { x.tenant_id, x.uploaded_by_user_id },
                        principalTable: "tenant_memberships",
                        principalColumns: new[] { "tenant_id", "user_id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_stored_files_tenant_id_uploaded_by_user_id",
                table: "stored_files",
                columns: new[] { "tenant_id", "uploaded_by_user_id" });

            migrationBuilder.CreateIndex(
                name: "ux_stored_files_tenant_storage_key",
                table: "stored_files",
                columns: new[] { "tenant_id", "storage_key" },
                unique: true);

            // Seguridad RLS: cada colegio solo puede acceder a sus propios archivos.
            migrationBuilder.Sql("""
                ALTER TABLE public.stored_files ENABLE ROW LEVEL SECURITY;
                ALTER TABLE public.stored_files FORCE ROW LEVEL SECURITY;

                CREATE POLICY rls_stored_files_tenant_isolation
                ON public.stored_files
                FOR ALL
                USING (
                    public.app_execution_mode() = 'tenant'
                    AND public.app_current_tenant_id() IS NOT NULL
                    AND tenant_id = public.app_current_tenant_id()
                )
                WITH CHECK (
                    public.app_execution_mode() = 'tenant'
                    AND public.app_current_tenant_id() IS NOT NULL
                    AND tenant_id = public.app_current_tenant_id()
                );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "stored_files");

            migrationBuilder.DropUniqueConstraint(
                name: "ak_tenant_memberships_tenant_user",
                table: "tenant_memberships");

            migrationBuilder.CreateIndex(
                name: "ux_tenant_memberships_tenant_user",
                table: "tenant_memberships",
                columns: new[] { "tenant_id", "user_id" },
                unique: true);
        }
    }
}