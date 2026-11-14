using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Knorooms.Modules.Common.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddInstitutionStaffInvitations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "institution_staff_invitations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    token_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    expires_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    accepted_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    revoked_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    delivery_status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_institution_staff_invitations", x => x.id);
                    table.UniqueConstraint("ak_institution_staff_invitations_tenant_id", x => new { x.tenant_id, x.id });
                    table.ForeignKey(
                        name: "FK_institution_staff_invitations_institutions_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "institutions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "institution_staff_invitation_roles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    invitation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_institution_staff_invitation_roles", x => x.id);
                    table.ForeignKey(
                        name: "FK_institution_staff_invitation_roles_institution_roles_tenant~",
                        columns: x => new { x.tenant_id, x.role_id },
                        principalTable: "institution_roles",
                        principalColumns: new[] { "tenant_id", "id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_institution_staff_invitation_roles_institution_staff_invita~",
                        columns: x => new { x.tenant_id, x.invitation_id },
                        principalTable: "institution_staff_invitations",
                        principalColumns: new[] { "tenant_id", "id" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_institution_staff_invitation_roles_tenant_id_role_id",
                table: "institution_staff_invitation_roles",
                columns: new[] { "tenant_id", "role_id" });

            migrationBuilder.CreateIndex(
                name: "ux_institution_staff_invitation_roles_unique",
                table: "institution_staff_invitation_roles",
                columns: new[] { "tenant_id", "invitation_id", "role_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_institution_staff_invitations_tenant_email",
                table: "institution_staff_invitations",
                columns: new[] { "tenant_id", "email" });
        migrationBuilder.Sql(PostgresRlsPolicySql.BuildStaffInvitationUpSql());
}

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "institution_staff_invitation_roles");

            migrationBuilder.DropTable(
                name: "institution_staff_invitations");
        }
    }
}
