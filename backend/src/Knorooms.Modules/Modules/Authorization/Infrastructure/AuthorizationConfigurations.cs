using Knorooms.Modules.Modules.Authorization.Domain;
using Knorooms.Modules.Modules.Identity.Domain;
using Knorooms.Modules.Modules.Tenants.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Knorooms.Modules.Modules.Authorization.Infrastructure;

internal sealed class PermissionRecordConfiguration : IEntityTypeConfiguration<PermissionRecord>
{
    public void Configure(EntityTypeBuilder<PermissionRecord> builder)
    {
        builder.ToTable("permissions");

        builder.HasKey(x => x.Code);

        builder.Property(x => x.Code)
            .HasColumnName("code")
            .HasMaxLength(120)
            .ValueGeneratedNever();

        builder.Property(x => x.Name)
            .HasColumnName("name")
            .HasMaxLength(160)
            .IsRequired();

        builder.Property(x => x.Description)
            .HasColumnName("description")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(x => x.Scope)
            .HasColumnName("scope")
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.Module)
            .HasColumnName("module")
            .HasMaxLength(64)
            .IsRequired();
    }
}

internal sealed class InstitutionRoleConfiguration : IEntityTypeConfiguration<InstitutionRole>
{
    public void Configure(EntityTypeBuilder<InstitutionRole> builder)
    {
        builder.ToTable("institution_roles");

        builder.HasKey(x => x.Id);

        // Clave candidata compuesta (tenant_id, id) para integridad referencial estricta entre tablas del mismo tenant.
        builder.HasAlternateKey(x => new { x.TenantId, x.Id })
            .HasName("ak_institution_roles_tenant_id");

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(x => x.TenantId)
            .HasColumnName("tenant_id")
            .IsRequired();

        builder.Property(x => x.Code)
            .HasColumnName("code")
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(x => x.Name)
            .HasColumnName("name")
            .HasMaxLength(120)
            .IsRequired();

        builder.Property(x => x.Description)
            .HasColumnName("description")
            .HasMaxLength(400)
            .IsRequired();

        builder.Property(x => x.IsSystemRole)
            .HasColumnName("is_system_role")
            .IsRequired();

        builder.Property(x => x.CreatedAtUtc)
            .HasColumnName("created_at_utc")
            .IsRequired();

        builder.Property(x => x.UpdatedAtUtc)
            .HasColumnName("updated_at_utc");

        builder.HasIndex(x => new { x.TenantId, x.Code })
            .IsUnique()
            .HasDatabaseName("ux_institution_roles_tenant_code");

        builder.HasOne<Institution>()
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Permissions)
            .WithOne()
            .HasForeignKey(x => new { x.TenantId, x.RoleId })
            .HasPrincipalKey(x => new { x.TenantId, x.Id })
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(x => x.Permissions)
            .UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.Ignore(x => x.DomainEvents);
    }
}

internal sealed class InstitutionRolePermissionConfiguration : IEntityTypeConfiguration<InstitutionRolePermission>
{
    public void Configure(EntityTypeBuilder<InstitutionRolePermission> builder)
    {
        builder.ToTable("institution_role_permissions");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(x => x.TenantId)
            .HasColumnName("tenant_id")
            .IsRequired();

        builder.Property(x => x.RoleId)
            .HasColumnName("role_id")
            .IsRequired();

        builder.Property(x => x.PermissionCode)
            .HasColumnName("permission_code")
            .HasMaxLength(120)
            .IsRequired();

        builder.Property(x => x.CreatedAtUtc)
            .HasColumnName("created_at_utc")
            .IsRequired();

        builder.Property(x => x.UpdatedAtUtc)
            .HasColumnName("updated_at_utc");

        builder.HasIndex(x => new { x.TenantId, x.RoleId, x.PermissionCode })
            .IsUnique()
            .HasDatabaseName("ux_institution_role_permissions_unique");

        builder.HasOne<PermissionRecord>()
            .WithMany()
            .HasForeignKey(x => x.PermissionCode)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Ignore(x => x.DomainEvents);
    }
}

internal sealed class TenantMembershipConfiguration : IEntityTypeConfiguration<TenantMembership>
{
    public void Configure(EntityTypeBuilder<TenantMembership> builder)
    {
        builder.ToTable("tenant_memberships");

        builder.HasKey(x => x.Id);

        builder.HasAlternateKey(x => new { x.TenantId, x.Id })
            .HasName("ak_tenant_memberships_tenant_id");

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(x => x.TenantId)
            .HasColumnName("tenant_id")
            .IsRequired();

        builder.Property(x => x.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.RevokedAtUtc)
            .HasColumnName("revoked_at_utc");

        builder.Property(x => x.RevokedByUserId)
            .HasColumnName("revoked_by_user_id");

        builder.Property(x => x.RevocationReason)
            .HasColumnName("revocation_reason")
            .HasMaxLength(300);

        builder.Property(x => x.CreatedAtUtc)
            .HasColumnName("created_at_utc")
            .IsRequired();

        builder.Property(x => x.UpdatedAtUtc)
            .HasColumnName("updated_at_utc");

        builder.HasIndex(x => new { x.TenantId, x.UserId })
            .IsUnique()
            .HasDatabaseName("ux_tenant_memberships_tenant_user");

        builder.HasIndex(x => x.UserId)
            .HasDatabaseName("ix_tenant_memberships_user_id");

        builder.HasOne<Institution>()
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<UserAccount>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Roles)
            .WithOne()
            .HasForeignKey(x => new { x.TenantId, x.MembershipId })
            .HasPrincipalKey(x => new { x.TenantId, x.Id })
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(x => x.Roles)
            .UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.Ignore(x => x.DomainEvents);
    }
}

internal sealed class TenantMembershipRoleConfiguration : IEntityTypeConfiguration<TenantMembershipRole>
{
    public void Configure(EntityTypeBuilder<TenantMembershipRole> builder)
    {
        builder.ToTable("tenant_membership_roles");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(x => x.TenantId)
            .HasColumnName("tenant_id")
            .IsRequired();

        builder.Property(x => x.MembershipId)
            .HasColumnName("membership_id")
            .IsRequired();

        builder.Property(x => x.RoleId)
            .HasColumnName("role_id")
            .IsRequired();

        builder.Property(x => x.CreatedAtUtc)
            .HasColumnName("created_at_utc")
            .IsRequired();

        builder.Property(x => x.UpdatedAtUtc)
            .HasColumnName("updated_at_utc");

        builder.HasIndex(x => new { x.TenantId, x.MembershipId, x.RoleId })
            .IsUnique()
            .HasDatabaseName("ux_tenant_membership_roles_unique");

        // FK compuesta: impide a nivel de PostgreSQL asignar un rol de otro tenant a una membresía.
        builder.HasOne<InstitutionRole>()
            .WithMany()
            .HasForeignKey(x => new { x.TenantId, x.RoleId })
            .HasPrincipalKey(x => new { x.TenantId, x.Id })
            .OnDelete(DeleteBehavior.Restrict);

        builder.Ignore(x => x.DomainEvents);
    }
}
