using Knorooms.Modules.Modules.Tenants.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Knorooms.Modules.Modules.Tenants.Infrastructure;

internal sealed class InstitutionConfiguration : IEntityTypeConfiguration<Institution>
{
    public void Configure(EntityTypeBuilder<Institution> builder)
    {
        builder.ToTable("institutions");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(x => x.Slug)
            .HasColumnName("slug")
            .HasMaxLength(63)
            .IsRequired();

        builder.Property(x => x.Name)
            .HasColumnName("name")
            .HasMaxLength(160)
            .IsRequired();

        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.AcademicProfile)
            .HasColumnName("academic_profile")
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.TimeZoneId)
            .HasColumnName("time_zone_id")
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(x => x.CreatedAtUtc)
            .HasColumnName("created_at_utc")
            .IsRequired();

        builder.Property(x => x.UpdatedAtUtc)
            .HasColumnName("updated_at_utc");

        builder.Property(x => x.Version)
            .IsRowVersion();

        builder.HasIndex(x => x.Slug)
            .IsUnique()
            .HasDatabaseName("ux_institutions_slug");

        builder.Property(x => x.ContactName).HasColumnName("contact_name").HasMaxLength(160).HasDefaultValue("").IsRequired();
        builder.Property(x => x.ContactEmail).HasColumnName("contact_email").HasMaxLength(320).HasDefaultValue("").IsRequired();
        builder.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(40).HasDefaultValue("").IsRequired();
        builder.Property(x => x.Address).HasColumnName("address").HasMaxLength(500).HasDefaultValue("").IsRequired();
        builder.Property(x => x.CenterCode).HasColumnName("center_code").HasMaxLength(50).HasDefaultValue("").IsRequired();
        builder.Property(x => x.LogoUrl).HasColumnName("logo_url").HasMaxLength(1000).HasDefaultValue("").IsRequired();
        builder.Property(x => x.OnboardingOwner).HasColumnName("onboarding_owner").HasMaxLength(160).HasDefaultValue("").IsRequired();
        builder.Property(x => x.OnboardingNotes).HasColumnName("onboarding_notes").HasMaxLength(2000).HasDefaultValue("").IsRequired();
        builder.Property(x => x.WelcomeMeetingCompleted).HasColumnName("welcome_meeting_completed").HasDefaultValue(false);

        builder.Ignore(x => x.DomainEvents);
    }
}
