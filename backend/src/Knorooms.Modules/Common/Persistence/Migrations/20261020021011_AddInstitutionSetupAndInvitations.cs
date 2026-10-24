using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Knorooms.Modules.Common.Persistence.Migrations;

/// <inheritdoc />
public partial class AddInstitutionSetupAndInvitations : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "address",
            table: "institutions",
            type: "character varying(500)",
            maxLength: 500,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<string>(
            name: "center_code",
            table: "institutions",
            type: "character varying(50)",
            maxLength: 50,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<string>(
            name: "contact_email",
            table: "institutions",
            type: "character varying(320)",
            maxLength: 320,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<string>(
            name: "contact_name",
            table: "institutions",
            type: "character varying(160)",
            maxLength: 160,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<string>(
            name: "logo_url",
            table: "institutions",
            type: "character varying(1000)",
            maxLength: 1000,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<string>(
            name: "onboarding_notes",
            table: "institutions",
            type: "character varying(2000)",
            maxLength: 2000,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<string>(
            name: "onboarding_owner",
            table: "institutions",
            type: "character varying(160)",
            maxLength: 160,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<string>(
            name: "phone",
            table: "institutions",
            type: "character varying(40)",
            maxLength: 40,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<bool>(
            name: "welcome_meeting_completed",
            table: "institutions",
            type: "boolean",
            nullable: false,
            defaultValue: false);

        migrationBuilder.CreateTable(
            name: "administrator_invitations",
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
                table.PrimaryKey("PK_administrator_invitations", x => x.id);
                table.UniqueConstraint("AK_administrator_invitations_tenant_id_id", x => new { x.tenant_id, x.id });
                table.ForeignKey(
                    name: "FK_administrator_invitations_institutions_tenant_id",
                    column: x => x.tenant_id,
                    principalTable: "institutions",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_administrator_invitations_tenant_id_email",
            table: "administrator_invitations",
            columns: new[] { "tenant_id", "email" });
        migrationBuilder.Sql(PostgresRlsPolicySql.BuildInvitationUpSql());
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "administrator_invitations");

        migrationBuilder.DropColumn(
            name: "address",
            table: "institutions");

        migrationBuilder.DropColumn(
            name: "center_code",
            table: "institutions");

        migrationBuilder.DropColumn(
            name: "contact_email",
            table: "institutions");

        migrationBuilder.DropColumn(
            name: "contact_name",
            table: "institutions");

        migrationBuilder.DropColumn(
            name: "logo_url",
            table: "institutions");

        migrationBuilder.DropColumn(
            name: "onboarding_notes",
            table: "institutions");

        migrationBuilder.DropColumn(
            name: "onboarding_owner",
            table: "institutions");

        migrationBuilder.DropColumn(
            name: "phone",
            table: "institutions");

        migrationBuilder.DropColumn(
            name: "welcome_meeting_completed",
            table: "institutions");
    }
}
