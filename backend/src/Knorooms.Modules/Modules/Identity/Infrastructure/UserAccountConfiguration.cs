using Knorooms.Modules.Modules.Identity.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Knorooms.Modules.Modules.Identity.Infrastructure;

internal sealed class UserAccountConfiguration : IEntityTypeConfiguration<UserAccount>
{
    public void Configure(EntityTypeBuilder<UserAccount> builder)
    {
        builder.ToTable("users");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(x => x.ExternalSubject)
            .HasColumnName("external_subject")
            .HasMaxLength(191)
            .IsRequired();

        builder.Property(x => x.IdentityProviderIssuer)
            .HasColumnName("idp_issuer")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(x => x.Email)
            .HasColumnName("email")
            .HasMaxLength(254)
            .IsRequired();

        builder.Property(x => x.DisplayName)
            .HasColumnName("display_name")
            .HasMaxLength(160)
            .IsRequired();

        builder.Property(x => x.IsPlatformAdmin)
            .HasColumnName("is_platform_admin")
            .IsRequired();

        builder.Property(x => x.IsPlatformSupport)
            .HasColumnName("is_platform_support")
            .IsRequired();

        builder.Property(x => x.IsActive)
            .HasColumnName("is_active")
            .IsRequired();

        builder.Property(x => x.LastAuthenticatedAtUtc)
            .HasColumnName("last_authenticated_at_utc");

        builder.Property(x => x.SessionRevokedBeforeUtc)
            .HasColumnName("session_revoked_before_utc");

        builder.Property(x => x.CreatedAtUtc)
            .HasColumnName("created_at_utc")
            .IsRequired();

        builder.Property(x => x.UpdatedAtUtc)
            .HasColumnName("updated_at_utc");

        builder.HasIndex(x => new { x.IdentityProviderIssuer, x.ExternalSubject })
            .IsUnique()
            .HasDatabaseName("ux_users_issuer_subject");

        builder.HasIndex(x => x.Email)
            .IsUnique()
            .HasDatabaseName("ux_users_email");

        builder.Ignore(x => x.DomainEvents);
    }
}
