using Knorooms.Modules.Modules.Academic.Domain;
using Knorooms.Modules.Modules.Attendance.Domain;
using Knorooms.Modules.Modules.Authorization.Domain;
using Knorooms.Modules.Modules.Enrollments.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Knorooms.Modules.Modules.Attendance.Infrastructure;

internal sealed class AttendanceRecordConfiguration : IEntityTypeConfiguration<AttendanceRecord>
{
    public void Configure(EntityTypeBuilder<AttendanceRecord> builder)
    {
        builder.ToTable("attendance_records");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(x => x.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(x => x.EnrollmentId).HasColumnName("enrollment_id").IsRequired();
        builder.Property(x => x.SectionId).HasColumnName("section_id").IsRequired();
        builder.Property(x => x.AttendanceDate).HasColumnName("attendance_date").IsRequired();
        builder.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(x => x.RecordedByMembershipId).HasColumnName("recorded_by_membership_id").IsRequired();
        builder.Property(x => x.JustificationNote).HasColumnName("justification_note").HasMaxLength(300);
        builder.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc").IsRequired();
        builder.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");

        builder.HasIndex(x => new { x.TenantId, x.EnrollmentId, x.AttendanceDate })
            .IsUnique()
            .HasDatabaseName("ux_attendance_records_tenant_enrollment_date");

        builder.HasOne<StudentEnrollment>()
            .WithMany()
            .HasForeignKey(x => new { x.TenantId, x.EnrollmentId })
            .HasPrincipalKey(x => new { x.TenantId, x.Id })
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<SchoolSection>()
            .WithMany()
            .HasForeignKey(x => new { x.TenantId, x.SectionId })
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
