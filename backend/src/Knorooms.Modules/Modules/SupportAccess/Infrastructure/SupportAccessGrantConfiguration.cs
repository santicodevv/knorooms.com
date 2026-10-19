using Knorooms.Modules.Modules.Identity.Domain;
using Knorooms.Modules.Modules.SupportAccess.Domain;
using Knorooms.Modules.Modules.Tenants.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Knorooms.Modules.Modules.SupportAccess.Infrastructure;

internal sealed class SupportAccessGrantConfiguration : IEntityTypeConfiguration<SupportAccessGrant>
{
    public void Configure(EntityTypeBuilder<SupportAccessGrant> builder)
    {
        builder.ToTable("support_access_grants");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(x => x.TenantId)
            .HasColumnName("tenant_id")
            .IsRequired();

        builder.Property(x => x.RequestedByUserId)
            .HasColumnName("requested_by_user_id")
            .IsRequired();

        builder.Property(x => x.Reason)
            .HasColumnName("reason")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(x => x.Permissions)
            .HasColumnName("permissions")
            .HasColumnType("text[]")
            .IsRequired();

        builder.Property(x => x.DurationMinutes)
            .HasColumnName("duration_minutes")
            .IsRequired();

        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.RequestedAtUtc)
            .HasColumnName("requested_at_utc")
            .IsRequired();

        builder.Property(x => x.ApprovedByUserId)
            .HasColumnName("approved_by_user_id");

        builder.Property(x => x.ApprovedAtUtc)
            .HasColumnName("approved_at_utc");

        builder.Property(x => x.ExpiresAtUtc)
            .HasColumnName("expires_at_utc");

        builder.Property(x => x.RejectedByUserId)
            .HasColumnName("rejected_by_user_id");

        builder.Property(x => x.RejectedAtUtc)
            .HasColumnName("rejected_at_utc");

        builder.Property(x => x.RevokedByUserId)
            .HasColumnName("revoked_by_user_id");

        builder.Property(x => x.RevokedAtUtc)
            .HasColumnName("revoked_at_utc");

        builder.Property(x => x.CreatedAtUtc)
            .HasColumnName("created_at_utc")
            .IsRequired();

        builder.Property(x => x.UpdatedAtUtc)
            .HasColumnName("updated_at_utc");

        builder.HasIndex(x => new { x.TenantId, x.Status })
            .HasDatabaseName("ix_support_access_grants_tenant_status");

        builder.HasOne<Institution>()
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<UserAccount>()
            .WithMany()
            .HasForeignKey(x => x.RequestedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Ignore(x => x.DomainEvents);
    }
}
