using Knorooms.Modules.Modules.Academic.Domain;
using Knorooms.Modules.Modules.Authorization.Domain;
using Knorooms.Modules.Modules.Enrollments.Domain;
using Knorooms.Modules.Modules.Grading.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Knorooms.Modules.Modules.Grading.Infrastructure;

internal sealed class EvaluationPolicyVersionConfiguration : IEntityTypeConfiguration<EvaluationPolicyVersion>
{
    public void Configure(EntityTypeBuilder<EvaluationPolicyVersion> builder)
    {
        builder.ToTable("evaluation_policy_versions");
        builder.HasKey(x => x.Id);
        builder.HasAlternateKey(x => new { x.TenantId, x.Id }).HasName("ak_evaluation_policy_versions_tenant_id");

        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(x => x.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(x => x.AcademicYearId).HasColumnName("academic_year_id").IsRequired();
        builder.Property(x => x.PolicyCode).HasColumnName("policy_code").HasMaxLength(64).IsRequired();
        builder.Property(x => x.VersionNumber).HasColumnName("version_number").IsRequired();
        builder.Property(x => x.Name).HasColumnName("name").HasMaxLength(160).IsRequired();
        builder.Property(x => x.RulesSpecificationJson).HasColumnName("rules_specification_json").HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.IsValidatedWithPilotSchool).HasColumnName("is_validated_with_pilot_school").IsRequired();
        builder.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc").IsRequired();
        builder.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");

        builder.HasIndex(x => new { x.TenantId, x.AcademicYearId, x.PolicyCode, x.VersionNumber })
            .IsUnique()
            .HasDatabaseName("ux_evaluation_policy_versions_unique");

        builder.HasOne<AcademicYear>()
            .WithMany()
            .HasForeignKey(x => new { x.TenantId, x.AcademicYearId })
            .HasPrincipalKey(x => new { x.TenantId, x.Id })
            .OnDelete(DeleteBehavior.Restrict);

        builder.Ignore(x => x.DomainEvents);
    }
}

internal sealed class GradeEntryConfiguration : IEntityTypeConfiguration<GradeEntry>
{
    public void Configure(EntityTypeBuilder<GradeEntry> builder)
    {
        builder.ToTable("grade_entries");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(x => x.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(x => x.EnrollmentId).HasColumnName("enrollment_id").IsRequired();
        builder.Property(x => x.SubjectId).HasColumnName("subject_id").IsRequired();
        builder.Property(x => x.EvaluationPolicyVersionId).HasColumnName("evaluation_policy_version_id").IsRequired();
        builder.Property(x => x.PeriodCode).HasColumnName("period_code").HasMaxLength(16).IsRequired();
        builder.Property(x => x.NumericScore).HasColumnName("numeric_score").HasPrecision(5, 2).IsRequired();
        builder.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(x => x.RecordedByMembershipId).HasColumnName("recorded_by_membership_id").IsRequired();
        builder.Property(x => x.ApprovedByMembershipId).HasColumnName("approved_by_membership_id");
        builder.Property(x => x.CorrectionReason).HasColumnName("correction_reason").HasMaxLength(400);
        builder.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc").IsRequired();
        builder.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");

        builder.HasIndex(x => new { x.TenantId, x.EnrollmentId, x.SubjectId, x.PeriodCode })
            .IsUnique()
            .HasDatabaseName("ux_grade_entries_tenant_enrollment_subject_period");

        builder.HasOne<StudentEnrollment>()
            .WithMany()
            .HasForeignKey(x => new { x.TenantId, x.EnrollmentId })
            .HasPrincipalKey(x => new { x.TenantId, x.Id })
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Subject>()
            .WithMany()
            .HasForeignKey(x => new { x.TenantId, x.SubjectId })
            .HasPrincipalKey(x => new { x.TenantId, x.Id })
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<EvaluationPolicyVersion>()
            .WithMany()
            .HasForeignKey(x => new { x.TenantId, x.EvaluationPolicyVersionId })
            .HasPrincipalKey(x => new { x.TenantId, x.Id })
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<TenantMembership>()
            .WithMany()
            .HasForeignKey(x => new { x.TenantId, x.RecordedByMembershipId })
            .HasPrincipalKey(x => new { x.TenantId, x.Id })
            .OnDelete(DeleteBehavior.Restrict);

        builder.Ignore(x => x.DomainEvents);
    }
}
