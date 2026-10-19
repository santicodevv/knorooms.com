using Knorooms.Modules.Modules.Academic.Domain;
using Knorooms.Modules.Modules.Enrollments.Domain;
using Knorooms.Modules.Modules.Students.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Knorooms.Modules.Modules.Enrollments.Infrastructure;

internal sealed class StudentEnrollmentConfiguration : IEntityTypeConfiguration<StudentEnrollment>
{
    public void Configure(EntityTypeBuilder<StudentEnrollment> builder)
    {
        builder.ToTable("student_enrollments");
        builder.HasKey(x => x.Id);
        builder.HasAlternateKey(x => new { x.TenantId, x.Id }).HasName("ak_student_enrollments_tenant_id");

        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(x => x.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(x => x.StudentId).HasColumnName("student_id").IsRequired();
        builder.Property(x => x.AcademicYearId).HasColumnName("academic_year_id").IsRequired();
        builder.Property(x => x.SectionId).HasColumnName("section_id").IsRequired();
        builder.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(x => x.EnrolledAtUtc).HasColumnName("enrolled_at_utc").IsRequired();
        builder.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc").IsRequired();
        builder.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");

        // Un expediente estudiantil solo puede tener una matrícula por año escolar en el mismo colegio.
        builder.HasIndex(x => new { x.TenantId, x.StudentId, x.AcademicYearId })
            .IsUnique()
            .HasDatabaseName("ux_student_enrollments_tenant_student_year");

        builder.HasOne<StudentRecord>()
            .WithMany()
            .HasForeignKey(x => new { x.TenantId, x.StudentId })
            .HasPrincipalKey(x => new { x.TenantId, x.Id })
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<AcademicYear>()
            .WithMany()
            .HasForeignKey(x => new { x.TenantId, x.AcademicYearId })
            .HasPrincipalKey(x => new { x.TenantId, x.Id })
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<SchoolSection>()
            .WithMany()
            .HasForeignKey(x => new { x.TenantId, x.SectionId })
            .HasPrincipalKey(x => new { x.TenantId, x.Id })
            .OnDelete(DeleteBehavior.Restrict);

        builder.Ignore(x => x.DomainEvents);
    }
}
