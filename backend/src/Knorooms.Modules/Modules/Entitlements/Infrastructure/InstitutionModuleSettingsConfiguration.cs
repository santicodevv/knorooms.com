using Knorooms.Modules.Modules.Entitlements.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace Knorooms.Modules.Modules.Entitlements.Infrastructure;

internal sealed class InstitutionModuleSettingsConfiguration : IEntityTypeConfiguration<InstitutionModuleSettings>
{
    public void Configure(EntityTypeBuilder<InstitutionModuleSettings> b)
    {
        b.ToTable("institution_module_settings"); b.HasKey(x => x.Id); b.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        b.Property(x => x.TenantId).HasColumnName("tenant_id"); b.HasAlternateKey(x => new { x.TenantId, x.Id }); b.HasIndex(x => x.TenantId).IsUnique();
        b.Property(x => x.EnabledModules).HasColumnName("enabled_modules").HasColumnType("text[]");
        b.Property(x => x.MaxActiveStudents).HasColumnName("max_active_students"); b.Property(x => x.MaxSections).HasColumnName("max_sections");
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc"); b.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc"); b.Property(x => x.Version).IsRowVersion(); b.Ignore(x => x.DomainEvents);
    }
}
