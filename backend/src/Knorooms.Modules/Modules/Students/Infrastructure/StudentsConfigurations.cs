using Knorooms.Modules.Modules.Students.Domain;
using Knorooms.Modules.Modules.Tenants.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Knorooms.Modules.Modules.Students.Infrastructure;

internal sealed class StudentRecordConfiguration : IEntityTypeConfiguration<StudentRecord>
{
    public void Configure(EntityTypeBuilder<StudentRecord> builder)
    {
        builder.ToTable("students");

        builder.HasKey(x => x.Id);

        builder.HasAlternateKey(x => new { x.TenantId, x.Id })
            .HasName("ak_students_tenant_id");

        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(x => x.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(x => x.StudentCode).HasColumnName("student_code").HasMaxLength(32).IsRequired();
        builder.Property(x => x.FirstName).HasColumnName("first_name").HasMaxLength(120).IsRequired();
        builder.Property(x => x.LastName).HasColumnName("last_name").HasMaxLength(120).IsRequired();
        builder.Property(x => x.BirthDate).HasColumnName("birth_date").IsRequired();
        builder.Property(x => x.SigerdExternalId).HasColumnName("sigerd_external_id").HasMaxLength(64);
        builder.Property(x => x.IsActive).HasColumnName("is_active").IsRequired();
        builder.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc").IsRequired();
        builder.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");

        builder.HasIndex(x => new { x.TenantId, x.StudentCode })
            .IsUnique()
            .HasDatabaseName("ux_students_tenant_student_code");

        builder.HasOne<Institution>()
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Ignore(x => x.DomainEvents);
    }
}

internal sealed class GuardianConfiguration : IEntityTypeConfiguration<Guardian>
{
    public void Configure(EntityTypeBuilder<Guardian> builder)
    {
        builder.ToTable("guardians");

        builder.HasKey(x => x.Id);

        builder.HasAlternateKey(x => new { x.TenantId, x.Id })
            .HasName("ak_guardians_tenant_id");

        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(x => x.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(x => x.FullName).HasColumnName("full_name").HasMaxLength(160).IsRequired();
        builder.Property(x => x.Email).HasColumnName("email").HasMaxLength(254).IsRequired();
        builder.Property(x => x.PhoneNumber).HasColumnName("phone_number").HasMaxLength(32);
        builder.Property(x => x.UserAccountId).HasColumnName("user_account_id");
        builder.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc").IsRequired();
        builder.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");

        builder.HasIndex(x => new { x.TenantId, x.Email })
            .IsUnique()
            .HasDatabaseName("ux_guardians_tenant_email");

        builder.HasOne<Institution>()
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Ignore(x => x.DomainEvents);
    }
}

internal sealed class StudentGuardianLinkConfiguration : IEntityTypeConfiguration<StudentGuardianLink>
{
    public void Configure(EntityTypeBuilder<StudentGuardianLink> builder)
    {
        builder.ToTable("student_guardian_links");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(x => x.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(x => x.StudentId).HasColumnName("student_id").IsRequired();
        builder.Property(x => x.GuardianId).HasColumnName("guardian_id").IsRequired();
        builder.Property(x => x.RelationshipType).HasColumnName("relationship_type").HasMaxLength(64).IsRequired();
        builder.Property(x => x.HasAcademicAccess).HasColumnName("has_academic_access").IsRequired();
        builder.Property(x => x.HasFinancialResponsibility).HasColumnName("has_financial_responsibility").IsRequired();
        builder.Property(x => x.HasPickupAuthorization).HasColumnName("has_pickup_authorization").IsRequired();
        builder.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc").IsRequired();
        builder.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");

        builder.HasIndex(x => new { x.TenantId, x.StudentId, x.GuardianId })
            .IsUnique()
            .HasDatabaseName("ux_student_guardian_links_unique");

        builder.HasOne<StudentRecord>()
            .WithMany()
            .HasForeignKey(x => new { x.TenantId, x.StudentId })
            .HasPrincipalKey(x => new { x.TenantId, x.Id })
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Guardian>()
            .WithMany()
            .HasForeignKey(x => new { x.TenantId, x.GuardianId })
            .HasPrincipalKey(x => new { x.TenantId, x.Id })
            .OnDelete(DeleteBehavior.Cascade);

        builder.Ignore(x => x.DomainEvents);
    }
}
