using Knorooms.Modules.Modules.Academic.Domain;
using Knorooms.Modules.Modules.Authorization.Domain;
using Knorooms.Modules.Modules.Tenants.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Knorooms.Modules.Modules.Academic.Infrastructure;

internal sealed class AcademicYearConfiguration : IEntityTypeConfiguration<AcademicYear>
{
    public void Configure(EntityTypeBuilder<AcademicYear> builder)
    {
        builder.ToTable("academic_years");
        builder.HasKey(x => x.Id);
        builder.HasAlternateKey(x => new { x.TenantId, x.Id }).HasName("ak_academic_years_tenant_id");

        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(x => x.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(x => x.Code).HasColumnName("code").HasMaxLength(32).IsRequired();
        builder.Property(x => x.Name).HasColumnName("name").HasMaxLength(120).IsRequired();
        builder.Property(x => x.StartDate).HasColumnName("start_date").IsRequired();
        builder.Property(x => x.EndDate).HasColumnName("end_date").IsRequired();
        builder.Property(x => x.IsClosed).HasColumnName("is_closed").IsRequired();
        builder.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc").IsRequired();
        builder.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");

        builder.HasIndex(x => new { x.TenantId, x.Code })
            .IsUnique()
            .HasDatabaseName("ux_academic_years_tenant_code");

        builder.HasOne<Institution>()
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Ignore(x => x.DomainEvents);
    }
}

internal sealed class GradeLevelConfiguration : IEntityTypeConfiguration<GradeLevel>
{
    public void Configure(EntityTypeBuilder<GradeLevel> builder)
    {
        builder.ToTable("grade_levels");
        builder.HasKey(x => x.Id);
        builder.HasAlternateKey(x => new { x.TenantId, x.Id }).HasName("ak_grade_levels_tenant_id");

        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(x => x.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(x => x.Stage).HasColumnName("stage").HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(x => x.OfficialGradeNumber).HasColumnName("official_grade_number").IsRequired();
        builder.Property(x => x.Code).HasColumnName("code").HasMaxLength(32).IsRequired();
        builder.Property(x => x.DisplayName).HasColumnName("display_name").HasMaxLength(120).IsRequired();
        builder.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc").IsRequired();
        builder.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");

        builder.HasIndex(x => new { x.TenantId, x.Code })
            .IsUnique()
            .HasDatabaseName("ux_grade_levels_tenant_code");

        builder.HasOne<Institution>()
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Ignore(x => x.DomainEvents);
    }
}

internal sealed class SchoolSectionConfiguration : IEntityTypeConfiguration<SchoolSection>
{
    public void Configure(EntityTypeBuilder<SchoolSection> builder)
    {
        builder.ToTable("school_sections");
        builder.HasKey(x => x.Id);
        builder.HasAlternateKey(x => new { x.TenantId, x.Id }).HasName("ak_school_sections_tenant_id");

        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(x => x.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(x => x.AcademicYearId).HasColumnName("academic_year_id").IsRequired();
        builder.Property(x => x.GradeLevelId).HasColumnName("grade_level_id").IsRequired();
        builder.Property(x => x.Code).HasColumnName("code").HasMaxLength(16).IsRequired();
        builder.Property(x => x.Shift).HasColumnName("shift").HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(x => x.Capacity).HasColumnName("capacity").IsRequired();
        builder.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc").IsRequired();
        builder.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");

        builder.HasIndex(x => new { x.TenantId, x.AcademicYearId, x.GradeLevelId, x.Code })
            .IsUnique()
            .HasDatabaseName("ux_school_sections_tenant_year_grade_code");

        builder.HasOne<AcademicYear>()
            .WithMany()
            .HasForeignKey(x => new { x.TenantId, x.AcademicYearId })
            .HasPrincipalKey(x => new { x.TenantId, x.Id })
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<GradeLevel>()
            .WithMany()
            .HasForeignKey(x => new { x.TenantId, x.GradeLevelId })
            .HasPrincipalKey(x => new { x.TenantId, x.Id })
            .OnDelete(DeleteBehavior.Restrict);

        builder.Ignore(x => x.DomainEvents);
    }
}

internal sealed class SubjectConfiguration : IEntityTypeConfiguration<Subject>
{
    public void Configure(EntityTypeBuilder<Subject> builder)
    {
        builder.ToTable("subjects");
        builder.HasKey(x => x.Id);
        builder.HasAlternateKey(x => new { x.TenantId, x.Id }).HasName("ak_subjects_tenant_id");

        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(x => x.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(x => x.Code).HasColumnName("code").HasMaxLength(32).IsRequired();
        builder.Property(x => x.Name).HasColumnName("name").HasMaxLength(120).IsRequired();
        builder.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc").IsRequired();
        builder.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");

        builder.HasIndex(x => new { x.TenantId, x.Code })
            .IsUnique()
            .HasDatabaseName("ux_subjects_tenant_code");

        builder.HasOne<Institution>()
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Ignore(x => x.DomainEvents);
    }
}

internal sealed class TeacherAssignmentConfiguration : IEntityTypeConfiguration<TeacherAssignment>
{
    public void Configure(EntityTypeBuilder<TeacherAssignment> builder)
    {
        builder.ToTable("teacher_assignments");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(x => x.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(x => x.AcademicYearId).HasColumnName("academic_year_id").IsRequired();
        builder.Property(x => x.SectionId).HasColumnName("section_id").IsRequired();
        builder.Property(x => x.SubjectId).HasColumnName("subject_id").IsRequired();
        builder.Property(x => x.TeacherMembershipId).HasColumnName("teacher_membership_id").IsRequired();
        builder.Property(x => x.WeeklyHours).HasColumnName("weekly_hours").IsRequired();
        builder.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc").IsRequired();
        builder.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");

        builder.HasIndex(x => new { x.TenantId, x.SectionId, x.SubjectId })
            .IsUnique()
            .HasDatabaseName("ux_teacher_assignments_tenant_section_subject");

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

        builder.HasOne<Subject>()
            .WithMany()
            .HasForeignKey(x => new { x.TenantId, x.SubjectId })
            .HasPrincipalKey(x => new { x.TenantId, x.Id })
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<TenantMembership>()
            .WithMany()
            .HasForeignKey(x => new { x.TenantId, x.TeacherMembershipId })
            .HasPrincipalKey(x => new { x.TenantId, x.Id })
            .OnDelete(DeleteBehavior.Restrict);

        builder.Ignore(x => x.DomainEvents);
    }
}
