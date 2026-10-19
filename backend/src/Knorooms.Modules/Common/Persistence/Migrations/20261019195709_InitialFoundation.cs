using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Knorooms.Modules.Common.Persistence.Migrations;

/// <inheritdoc />
public partial class InitialFoundation : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "audit_logs",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: true),
                actor_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                actor_access_type = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                support_access_grant_id = table.Column<Guid>(type: "uuid", nullable: true),
                action = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                resource_type = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                resource_id = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                summary = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                metadata_json = table.Column<string>(type: "jsonb", nullable: false),
                correlation_id = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_audit_logs", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "institutions",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                slug = table.Column<string>(type: "character varying(63)", maxLength: 63, nullable: false),
                name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                academic_profile = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                time_zone_id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_institutions", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "outbox_messages",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: true),
                event_type = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                payload_json = table.Column<string>(type: "jsonb", nullable: false),
                occurred_on_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                processed_on_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                attempt_count = table.Column<int>(type: "integer", nullable: false),
                last_error = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_outbox_messages", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "permissions",
            columns: table => new
            {
                code = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                scope = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                module = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_permissions", x => x.code);
            });

        migrationBuilder.CreateTable(
            name: "users",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                external_subject = table.Column<string>(type: "character varying(191)", maxLength: 191, nullable: false),
                idp_issuer = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                display_name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                is_platform_admin = table.Column<bool>(type: "boolean", nullable: false),
                is_platform_support = table.Column<bool>(type: "boolean", nullable: false),
                is_active = table.Column<bool>(type: "boolean", nullable: false),
                last_authenticated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                session_revoked_before_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_users", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "academic_years",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                start_date = table.Column<DateOnly>(type: "date", nullable: false),
                end_date = table.Column<DateOnly>(type: "date", nullable: false),
                is_closed = table.Column<bool>(type: "boolean", nullable: false),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_academic_years", x => x.id);
                table.UniqueConstraint("ak_academic_years_tenant_id", x => new { x.tenant_id, x.id });
                table.ForeignKey(
                    name: "FK_academic_years_institutions_tenant_id",
                    column: x => x.tenant_id,
                    principalTable: "institutions",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "grade_levels",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                stage = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                official_grade_number = table.Column<int>(type: "integer", nullable: false),
                code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                display_name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_grade_levels", x => x.id);
                table.UniqueConstraint("ak_grade_levels_tenant_id", x => new { x.tenant_id, x.id });
                table.ForeignKey(
                    name: "FK_grade_levels_institutions_tenant_id",
                    column: x => x.tenant_id,
                    principalTable: "institutions",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "guardians",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                full_name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                phone_number = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                user_account_id = table.Column<Guid>(type: "uuid", nullable: true),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_guardians", x => x.id);
                table.UniqueConstraint("ak_guardians_tenant_id", x => new { x.tenant_id, x.id });
                table.ForeignKey(
                    name: "FK_guardians_institutions_tenant_id",
                    column: x => x.tenant_id,
                    principalTable: "institutions",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "institution_roles",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                description = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: false),
                is_system_role = table.Column<bool>(type: "boolean", nullable: false),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_institution_roles", x => x.id);
                table.UniqueConstraint("ak_institution_roles_tenant_id", x => new { x.tenant_id, x.id });
                table.ForeignKey(
                    name: "FK_institution_roles_institutions_tenant_id",
                    column: x => x.tenant_id,
                    principalTable: "institutions",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "students",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                student_code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                first_name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                last_name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                birth_date = table.Column<DateOnly>(type: "date", nullable: false),
                sigerd_external_id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                is_active = table.Column<bool>(type: "boolean", nullable: false),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_students", x => x.id);
                table.UniqueConstraint("ak_students_tenant_id", x => new { x.tenant_id, x.id });
                table.ForeignKey(
                    name: "FK_students_institutions_tenant_id",
                    column: x => x.tenant_id,
                    principalTable: "institutions",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "subjects",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_subjects", x => x.id);
                table.UniqueConstraint("ak_subjects_tenant_id", x => new { x.tenant_id, x.id });
                table.ForeignKey(
                    name: "FK_subjects_institutions_tenant_id",
                    column: x => x.tenant_id,
                    principalTable: "institutions",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "support_access_grants",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                requested_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                permissions = table.Column<string[]>(type: "text[]", nullable: false),
                duration_minutes = table.Column<int>(type: "integer", nullable: false),
                status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                requested_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                approved_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                approved_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                expires_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                rejected_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                rejected_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                revoked_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                revoked_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_support_access_grants", x => x.id);
                table.ForeignKey(
                    name: "FK_support_access_grants_institutions_tenant_id",
                    column: x => x.tenant_id,
                    principalTable: "institutions",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_support_access_grants_users_requested_by_user_id",
                    column: x => x.requested_by_user_id,
                    principalTable: "users",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "tenant_memberships",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                user_id = table.Column<Guid>(type: "uuid", nullable: false),
                status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                revoked_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                revoked_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                revocation_reason = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_tenant_memberships", x => x.id);
                table.UniqueConstraint("ak_tenant_memberships_tenant_id", x => new { x.tenant_id, x.id });
                table.ForeignKey(
                    name: "FK_tenant_memberships_institutions_tenant_id",
                    column: x => x.tenant_id,
                    principalTable: "institutions",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_tenant_memberships_users_user_id",
                    column: x => x.user_id,
                    principalTable: "users",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "evaluation_policy_versions",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                academic_year_id = table.Column<Guid>(type: "uuid", nullable: false),
                policy_code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                version_number = table.Column<int>(type: "integer", nullable: false),
                name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                rules_specification_json = table.Column<string>(type: "jsonb", nullable: false),
                is_validated_with_pilot_school = table.Column<bool>(type: "boolean", nullable: false),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_evaluation_policy_versions", x => x.id);
                table.UniqueConstraint("ak_evaluation_policy_versions_tenant_id", x => new { x.tenant_id, x.id });
                table.ForeignKey(
                    name: "FK_evaluation_policy_versions_academic_years_tenant_id_academi~",
                    columns: x => new { x.tenant_id, x.academic_year_id },
                    principalTable: "academic_years",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "school_sections",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                academic_year_id = table.Column<Guid>(type: "uuid", nullable: false),
                grade_level_id = table.Column<Guid>(type: "uuid", nullable: false),
                code = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                shift = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                capacity = table.Column<int>(type: "integer", nullable: false),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_school_sections", x => x.id);
                table.UniqueConstraint("ak_school_sections_tenant_id", x => new { x.tenant_id, x.id });
                table.ForeignKey(
                    name: "FK_school_sections_academic_years_tenant_id_academic_year_id",
                    columns: x => new { x.tenant_id, x.academic_year_id },
                    principalTable: "academic_years",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_school_sections_grade_levels_tenant_id_grade_level_id",
                    columns: x => new { x.tenant_id, x.grade_level_id },
                    principalTable: "grade_levels",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "institution_role_permissions",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                role_id = table.Column<Guid>(type: "uuid", nullable: false),
                permission_code = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_institution_role_permissions", x => x.id);
                table.ForeignKey(
                    name: "FK_institution_role_permissions_institution_roles_tenant_id_ro~",
                    columns: x => new { x.tenant_id, x.role_id },
                    principalTable: "institution_roles",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_institution_role_permissions_permissions_permission_code",
                    column: x => x.permission_code,
                    principalTable: "permissions",
                    principalColumn: "code",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "student_guardian_links",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                student_id = table.Column<Guid>(type: "uuid", nullable: false),
                guardian_id = table.Column<Guid>(type: "uuid", nullable: false),
                relationship_type = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                has_academic_access = table.Column<bool>(type: "boolean", nullable: false),
                has_financial_responsibility = table.Column<bool>(type: "boolean", nullable: false),
                has_pickup_authorization = table.Column<bool>(type: "boolean", nullable: false),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_student_guardian_links", x => x.id);
                table.ForeignKey(
                    name: "FK_student_guardian_links_guardians_tenant_id_guardian_id",
                    columns: x => new { x.tenant_id, x.guardian_id },
                    principalTable: "guardians",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_student_guardian_links_students_tenant_id_student_id",
                    columns: x => new { x.tenant_id, x.student_id },
                    principalTable: "students",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "tenant_membership_roles",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                membership_id = table.Column<Guid>(type: "uuid", nullable: false),
                role_id = table.Column<Guid>(type: "uuid", nullable: false),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_tenant_membership_roles", x => x.id);
                table.ForeignKey(
                    name: "FK_tenant_membership_roles_institution_roles_tenant_id_role_id",
                    columns: x => new { x.tenant_id, x.role_id },
                    principalTable: "institution_roles",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_tenant_membership_roles_tenant_memberships_tenant_id_member~",
                    columns: x => new { x.tenant_id, x.membership_id },
                    principalTable: "tenant_memberships",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "student_enrollments",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                student_id = table.Column<Guid>(type: "uuid", nullable: false),
                academic_year_id = table.Column<Guid>(type: "uuid", nullable: false),
                section_id = table.Column<Guid>(type: "uuid", nullable: false),
                status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                enrolled_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_student_enrollments", x => x.id);
                table.UniqueConstraint("ak_student_enrollments_tenant_id", x => new { x.tenant_id, x.id });
                table.ForeignKey(
                    name: "FK_student_enrollments_academic_years_tenant_id_academic_year_~",
                    columns: x => new { x.tenant_id, x.academic_year_id },
                    principalTable: "academic_years",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_student_enrollments_school_sections_tenant_id_section_id",
                    columns: x => new { x.tenant_id, x.section_id },
                    principalTable: "school_sections",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_student_enrollments_students_tenant_id_student_id",
                    columns: x => new { x.tenant_id, x.student_id },
                    principalTable: "students",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "teacher_assignments",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                academic_year_id = table.Column<Guid>(type: "uuid", nullable: false),
                section_id = table.Column<Guid>(type: "uuid", nullable: false),
                subject_id = table.Column<Guid>(type: "uuid", nullable: false),
                teacher_membership_id = table.Column<Guid>(type: "uuid", nullable: false),
                weekly_hours = table.Column<int>(type: "integer", nullable: false),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_teacher_assignments", x => x.id);
                table.ForeignKey(
                    name: "FK_teacher_assignments_academic_years_tenant_id_academic_year_~",
                    columns: x => new { x.tenant_id, x.academic_year_id },
                    principalTable: "academic_years",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_teacher_assignments_school_sections_tenant_id_section_id",
                    columns: x => new { x.tenant_id, x.section_id },
                    principalTable: "school_sections",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_teacher_assignments_subjects_tenant_id_subject_id",
                    columns: x => new { x.tenant_id, x.subject_id },
                    principalTable: "subjects",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_teacher_assignments_tenant_memberships_tenant_id_teacher_me~",
                    columns: x => new { x.tenant_id, x.teacher_membership_id },
                    principalTable: "tenant_memberships",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "attendance_records",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                enrollment_id = table.Column<Guid>(type: "uuid", nullable: false),
                section_id = table.Column<Guid>(type: "uuid", nullable: false),
                attendance_date = table.Column<DateOnly>(type: "date", nullable: false),
                status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                recorded_by_membership_id = table.Column<Guid>(type: "uuid", nullable: false),
                justification_note = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_attendance_records", x => x.id);
                table.ForeignKey(
                    name: "FK_attendance_records_school_sections_tenant_id_section_id",
                    columns: x => new { x.tenant_id, x.section_id },
                    principalTable: "school_sections",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_attendance_records_student_enrollments_tenant_id_enrollment~",
                    columns: x => new { x.tenant_id, x.enrollment_id },
                    principalTable: "student_enrollments",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_attendance_records_tenant_memberships_tenant_id_recorded_by~",
                    columns: x => new { x.tenant_id, x.recorded_by_membership_id },
                    principalTable: "tenant_memberships",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "grade_entries",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                enrollment_id = table.Column<Guid>(type: "uuid", nullable: false),
                subject_id = table.Column<Guid>(type: "uuid", nullable: false),
                evaluation_policy_version_id = table.Column<Guid>(type: "uuid", nullable: false),
                period_code = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                numeric_score = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                recorded_by_membership_id = table.Column<Guid>(type: "uuid", nullable: false),
                approved_by_membership_id = table.Column<Guid>(type: "uuid", nullable: true),
                correction_reason = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: true),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_grade_entries", x => x.id);
                table.ForeignKey(
                    name: "FK_grade_entries_evaluation_policy_versions_tenant_id_evaluati~",
                    columns: x => new { x.tenant_id, x.evaluation_policy_version_id },
                    principalTable: "evaluation_policy_versions",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_grade_entries_student_enrollments_tenant_id_enrollment_id",
                    columns: x => new { x.tenant_id, x.enrollment_id },
                    principalTable: "student_enrollments",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_grade_entries_subjects_tenant_id_subject_id",
                    columns: x => new { x.tenant_id, x.subject_id },
                    principalTable: "subjects",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_grade_entries_tenant_memberships_tenant_id_recorded_by_memb~",
                    columns: x => new { x.tenant_id, x.recorded_by_membership_id },
                    principalTable: "tenant_memberships",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "report_card_snapshots",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                enrollment_id = table.Column<Guid>(type: "uuid", nullable: false),
                evaluation_policy_version_id = table.Column<Guid>(type: "uuid", nullable: false),
                period_code = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                version_number = table.Column<int>(type: "integer", nullable: false),
                immutable_payload_json = table.Column<string>(type: "jsonb", nullable: false),
                published_by_membership_id = table.Column<Guid>(type: "uuid", nullable: false),
                published_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                supersedes_snapshot_id = table.Column<Guid>(type: "uuid", nullable: true),
                correction_reason = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: true),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_report_card_snapshots", x => x.id);
                table.ForeignKey(
                    name: "FK_report_card_snapshots_evaluation_policy_versions_tenant_id_~",
                    columns: x => new { x.tenant_id, x.evaluation_policy_version_id },
                    principalTable: "evaluation_policy_versions",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_report_card_snapshots_student_enrollments_tenant_id_enrollm~",
                    columns: x => new { x.tenant_id, x.enrollment_id },
                    principalTable: "student_enrollments",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_report_card_snapshots_tenant_memberships_tenant_id_publishe~",
                    columns: x => new { x.tenant_id, x.published_by_membership_id },
                    principalTable: "tenant_memberships",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "ux_academic_years_tenant_code",
            table: "academic_years",
            columns: new[] { "tenant_id", "code" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_attendance_records_tenant_id_recorded_by_membership_id",
            table: "attendance_records",
            columns: new[] { "tenant_id", "recorded_by_membership_id" });

        migrationBuilder.CreateIndex(
            name: "IX_attendance_records_tenant_id_section_id",
            table: "attendance_records",
            columns: new[] { "tenant_id", "section_id" });

        migrationBuilder.CreateIndex(
            name: "ux_attendance_records_tenant_enrollment_date",
            table: "attendance_records",
            columns: new[] { "tenant_id", "enrollment_id", "attendance_date" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "ix_audit_logs_tenant_created_at",
            table: "audit_logs",
            columns: new[] { "tenant_id", "created_at_utc" });

        migrationBuilder.CreateIndex(
            name: "ux_evaluation_policy_versions_unique",
            table: "evaluation_policy_versions",
            columns: new[] { "tenant_id", "academic_year_id", "policy_code", "version_number" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_grade_entries_tenant_id_evaluation_policy_version_id",
            table: "grade_entries",
            columns: new[] { "tenant_id", "evaluation_policy_version_id" });

        migrationBuilder.CreateIndex(
            name: "IX_grade_entries_tenant_id_recorded_by_membership_id",
            table: "grade_entries",
            columns: new[] { "tenant_id", "recorded_by_membership_id" });

        migrationBuilder.CreateIndex(
            name: "IX_grade_entries_tenant_id_subject_id",
            table: "grade_entries",
            columns: new[] { "tenant_id", "subject_id" });

        migrationBuilder.CreateIndex(
            name: "ux_grade_entries_tenant_enrollment_subject_period",
            table: "grade_entries",
            columns: new[] { "tenant_id", "enrollment_id", "subject_id", "period_code" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "ux_grade_levels_tenant_code",
            table: "grade_levels",
            columns: new[] { "tenant_id", "code" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "ux_guardians_tenant_email",
            table: "guardians",
            columns: new[] { "tenant_id", "email" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_institution_role_permissions_permission_code",
            table: "institution_role_permissions",
            column: "permission_code");

        migrationBuilder.CreateIndex(
            name: "ux_institution_role_permissions_unique",
            table: "institution_role_permissions",
            columns: new[] { "tenant_id", "role_id", "permission_code" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "ux_institution_roles_tenant_code",
            table: "institution_roles",
            columns: new[] { "tenant_id", "code" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "ux_institutions_slug",
            table: "institutions",
            column: "slug",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "ix_outbox_messages_unprocessed",
            table: "outbox_messages",
            columns: new[] { "processed_on_utc", "occurred_on_utc" });

        migrationBuilder.CreateIndex(
            name: "IX_report_card_snapshots_tenant_id_evaluation_policy_version_id",
            table: "report_card_snapshots",
            columns: new[] { "tenant_id", "evaluation_policy_version_id" });

        migrationBuilder.CreateIndex(
            name: "IX_report_card_snapshots_tenant_id_published_by_membership_id",
            table: "report_card_snapshots",
            columns: new[] { "tenant_id", "published_by_membership_id" });

        migrationBuilder.CreateIndex(
            name: "ux_report_card_snapshots_version",
            table: "report_card_snapshots",
            columns: new[] { "tenant_id", "enrollment_id", "period_code", "version_number" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_school_sections_tenant_id_grade_level_id",
            table: "school_sections",
            columns: new[] { "tenant_id", "grade_level_id" });

        migrationBuilder.CreateIndex(
            name: "ux_school_sections_tenant_year_grade_code",
            table: "school_sections",
            columns: new[] { "tenant_id", "academic_year_id", "grade_level_id", "code" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_student_enrollments_tenant_id_academic_year_id",
            table: "student_enrollments",
            columns: new[] { "tenant_id", "academic_year_id" });

        migrationBuilder.CreateIndex(
            name: "IX_student_enrollments_tenant_id_section_id",
            table: "student_enrollments",
            columns: new[] { "tenant_id", "section_id" });

        migrationBuilder.CreateIndex(
            name: "ux_student_enrollments_tenant_student_year",
            table: "student_enrollments",
            columns: new[] { "tenant_id", "student_id", "academic_year_id" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_student_guardian_links_tenant_id_guardian_id",
            table: "student_guardian_links",
            columns: new[] { "tenant_id", "guardian_id" });

        migrationBuilder.CreateIndex(
            name: "ux_student_guardian_links_unique",
            table: "student_guardian_links",
            columns: new[] { "tenant_id", "student_id", "guardian_id" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "ux_students_tenant_student_code",
            table: "students",
            columns: new[] { "tenant_id", "student_code" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "ux_subjects_tenant_code",
            table: "subjects",
            columns: new[] { "tenant_id", "code" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_support_access_grants_requested_by_user_id",
            table: "support_access_grants",
            column: "requested_by_user_id");

        migrationBuilder.CreateIndex(
            name: "ix_support_access_grants_tenant_status",
            table: "support_access_grants",
            columns: new[] { "tenant_id", "status" });

        migrationBuilder.CreateIndex(
            name: "IX_teacher_assignments_tenant_id_academic_year_id",
            table: "teacher_assignments",
            columns: new[] { "tenant_id", "academic_year_id" });

        migrationBuilder.CreateIndex(
            name: "IX_teacher_assignments_tenant_id_subject_id",
            table: "teacher_assignments",
            columns: new[] { "tenant_id", "subject_id" });

        migrationBuilder.CreateIndex(
            name: "IX_teacher_assignments_tenant_id_teacher_membership_id",
            table: "teacher_assignments",
            columns: new[] { "tenant_id", "teacher_membership_id" });

        migrationBuilder.CreateIndex(
            name: "ux_teacher_assignments_tenant_section_subject",
            table: "teacher_assignments",
            columns: new[] { "tenant_id", "section_id", "subject_id" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_tenant_membership_roles_tenant_id_role_id",
            table: "tenant_membership_roles",
            columns: new[] { "tenant_id", "role_id" });

        migrationBuilder.CreateIndex(
            name: "ux_tenant_membership_roles_unique",
            table: "tenant_membership_roles",
            columns: new[] { "tenant_id", "membership_id", "role_id" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "ix_tenant_memberships_user_id",
            table: "tenant_memberships",
            column: "user_id");

        migrationBuilder.CreateIndex(
            name: "ux_tenant_memberships_tenant_user",
            table: "tenant_memberships",
            columns: new[] { "tenant_id", "user_id" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "ux_users_email",
            table: "users",
            column: "email",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "ux_users_issuer_subject",
            table: "users",
            columns: new[] { "idp_issuer", "external_subject" },
            unique: true);

        migrationBuilder.Sql(PostgresRlsPolicySql.BuildUpSql());
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(PostgresRlsPolicySql.BuildDownSql());

        migrationBuilder.DropTable(
            name: "attendance_records");

        migrationBuilder.DropTable(
            name: "audit_logs");

        migrationBuilder.DropTable(
            name: "grade_entries");

        migrationBuilder.DropTable(
            name: "institution_role_permissions");

        migrationBuilder.DropTable(
            name: "outbox_messages");

        migrationBuilder.DropTable(
            name: "report_card_snapshots");

        migrationBuilder.DropTable(
            name: "student_guardian_links");

        migrationBuilder.DropTable(
            name: "support_access_grants");

        migrationBuilder.DropTable(
            name: "teacher_assignments");

        migrationBuilder.DropTable(
            name: "tenant_membership_roles");

        migrationBuilder.DropTable(
            name: "permissions");

        migrationBuilder.DropTable(
            name: "evaluation_policy_versions");

        migrationBuilder.DropTable(
            name: "student_enrollments");

        migrationBuilder.DropTable(
            name: "guardians");

        migrationBuilder.DropTable(
            name: "subjects");

        migrationBuilder.DropTable(
            name: "institution_roles");

        migrationBuilder.DropTable(
            name: "tenant_memberships");

        migrationBuilder.DropTable(
            name: "school_sections");

        migrationBuilder.DropTable(
            name: "students");

        migrationBuilder.DropTable(
            name: "users");

        migrationBuilder.DropTable(
            name: "academic_years");

        migrationBuilder.DropTable(
            name: "grade_levels");

        migrationBuilder.DropTable(
            name: "institutions");
    }
}
