using Knorooms.Modules.Modules.Identity.Domain;
using Knorooms.Modules.Modules.Tenants.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Knorooms.Modules.Modules.Identity.Infrastructure;

internal sealed class AdministratorInvitationConfiguration : IEntityTypeConfiguration<AdministratorInvitation>
{
    public void Configure(EntityTypeBuilder<AdministratorInvitation> b)
    {
        b.ToTable("administrator_invitations");
        b.HasKey(x => x.Id);
        b.HasAlternateKey(x => new { x.TenantId, x.Id });
        b.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        b.Property(x => x.TenantId).HasColumnName("tenant_id");
        b.Property(x => x.Email).HasColumnName("email").HasMaxLength(320);
        b.Property(x => x.TokenHash).HasColumnName("token_hash").HasMaxLength(64);
        b.Property(x => x.ExpiresAtUtc).HasColumnName("expires_at_utc");
        b.Property(x => x.AcceptedAtUtc).HasColumnName("accepted_at_utc");
        b.Property(x => x.RevokedAtUtc).HasColumnName("revoked_at_utc");
        b.Property(x => x.DeliveryStatus).HasColumnName("delivery_status").HasMaxLength(24);
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
        b.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");
        b.HasIndex(x => new { x.TenantId, x.Email });
        b.HasOne<Institution>().WithMany().HasForeignKey(x => x.TenantId).OnDelete(DeleteBehavior.Restrict);
        b.Ignore(x => x.DomainEvents);
    }
}
