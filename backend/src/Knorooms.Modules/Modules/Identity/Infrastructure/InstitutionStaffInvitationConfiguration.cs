using Knorooms.Modules.Modules.Authorization.Domain;
using Knorooms.Modules.Modules.Identity.Domain;
using Knorooms.Modules.Modules.Tenants.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Knorooms.Modules.Modules.Identity.Infrastructure;

internal sealed class InstitutionStaffInvitationConfiguration
    : IEntityTypeConfiguration<InstitutionStaffInvitation>
{
    public void Configure(EntityTypeBuilder<InstitutionStaffInvitation> builder)
    {
        builder.ToTable("institution_staff_invitations");

        builder.HasKey(x => x.Id);

        builder.HasAlternateKey(x => new { x.TenantId, x.Id })
            .HasName("ak_institution_staff_invitations_tenant_id");

        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(x => x.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(x => x.Email).HasColumnName("email").HasMaxLength(320).IsRequired();
        builder.Property(x => x.TokenHash).HasColumnName("token_hash").HasMaxLength(64).IsRequired();
        builder.Property(x => x.ExpiresAtUtc).HasColumnName("expires_at_utc").IsRequired();
        builder.Property(x => x.AcceptedAtUtc).HasColumnName("accepted_at_utc");
        builder.Property(x => x.RevokedAtUtc).HasColumnName("revoked_at_utc");
        builder.Property(x => x.DeliveryStatus).HasColumnName("delivery_status").HasMaxLength(24).IsRequired();
        builder.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc").IsRequired();
        builder.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");

        builder.HasIndex(x => new { x.TenantId, x.Email })
            .HasDatabaseName("ix_institution_staff_invitations_tenant_email");

        builder.HasOne<Institution>()
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Roles)
            .WithOne()
            .HasForeignKey(x => new { x.TenantId, x.InvitationId })
            .HasPrincipalKey(x => new { x.TenantId, x.Id })
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(x => x.Roles)
            .UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.Ignore(x => x.DomainEvents);
    }
}

internal sealed class InstitutionStaffInvitationRoleConfiguration
    : IEntityTypeConfiguration<InstitutionStaffInvitationRole>
{
    public void Configure(EntityTypeBuilder<InstitutionStaffInvitationRole> builder)
    {
        builder.ToTable("institution_staff_invitation_roles");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(x => x.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(x => x.InvitationId).HasColumnName("invitation_id").IsRequired();
        builder.Property(x => x.RoleId).HasColumnName("role_id").IsRequired();
        builder.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc").IsRequired();
        builder.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");

        builder.HasIndex(x => new { x.TenantId, x.InvitationId, x.RoleId })
            .IsUnique()
            .HasDatabaseName("ux_institution_staff_invitation_roles_unique");

        builder.HasOne<InstitutionRole>()
            .WithMany()
            .HasForeignKey(x => new { x.TenantId, x.RoleId })
            .HasPrincipalKey(x => new { x.TenantId, x.Id })
            .OnDelete(DeleteBehavior.Restrict);

        builder.Ignore(x => x.DomainEvents);
    }
}
