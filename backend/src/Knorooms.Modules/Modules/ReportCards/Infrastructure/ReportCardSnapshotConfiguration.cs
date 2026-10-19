using Knorooms.Modules.Modules.Authorization.Domain;
using Knorooms.Modules.Modules.Enrollments.Domain;
using Knorooms.Modules.Modules.Grading.Domain;
using Knorooms.Modules.Modules.ReportCards.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Knorooms.Modules.Modules.ReportCards.Infrastructure;

internal sealed class ReportCardSnapshotConfiguration : IEntityTypeConfiguration<ReportCardSnapshot>
{
    public void Configure(EntityTypeBuilder<ReportCardSnapshot> builder)
    {
        builder.ToTable("report_card_snapshots");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(x => x.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(x => x.EnrollmentId).HasColumnName("enrollment_id").IsRequired();
        builder.Property(x => x.EvaluationPolicyVersionId).HasColumnName("evaluation_policy_version_id").IsRequired();
        builder.Property(x => x.PeriodCode).HasColumnName("period_code").HasMaxLength(16).IsRequired();
        builder.Property(x => x.VersionNumber).HasColumnName("version_number").IsRequired();
        builder.Property(x => x.ImmutablePayloadJson).HasColumnName("immutable_payload_json").HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.PublishedByMembershipId).HasColumnName("published_by_membership_id").IsRequired();
        builder.Property(x => x.PublishedAtUtc).HasColumnName("published_at_utc").IsRequired();
        builder.Property(x => x.SupersedesSnapshotId).HasColumnName("supersedes_snapshot_id");
        builder.Property(x => x.CorrectionReason).HasColumnName("correction_reason").HasMaxLength(400);
        builder.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc").IsRequired();
        builder.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");

        builder.HasIndex(x => new { x.TenantId, x.EnrollmentId, x.PeriodCode, x.VersionNumber })
            .IsUnique()
            .HasDatabaseName("ux_report_card_snapshots_version");

        builder.HasOne<StudentEnrollment>()
            .WithMany()
            .HasForeignKey(x => new { x.TenantId, x.EnrollmentId })
            .HasPrincipalKey(x => new { x.TenantId, x.Id })
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<EvaluationPolicyVersion>()
            .WithMany()
            .HasForeignKey(x => new { x.TenantId, x.EvaluationPolicyVersionId })
            .HasPrincipalKey(x => new { x.TenantId, x.Id })
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<TenantMembership>()
            .WithMany()
            .HasForeignKey(x => new { x.TenantId, x.PublishedByMembershipId })
            .HasPrincipalKey(x => new { x.TenantId, x.Id })
            .OnDelete(DeleteBehavior.Restrict);

        builder.Ignore(x => x.DomainEvents);
    }
}
