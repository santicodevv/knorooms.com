using Knorooms.Modules.Modules.Subscriptions.Domain;
using Knorooms.SharedKernel.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace Knorooms.Modules.Modules.Subscriptions.Infrastructure;
internal static class CommercialEntityConfiguration
{
    internal static void Base<T>(EntityTypeBuilder<T> b, string table) where T : Entity
    {
        b.ToTable(table); b.HasKey(x => x.Id); b.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc"); b.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc"); b.Ignore(x => x.DomainEvents);
    }
}
internal sealed class PlanVersionConfiguration : IEntityTypeConfiguration<PlanVersion>
{
    public void Configure(EntityTypeBuilder<PlanVersion> b)
    {
        CommercialEntityConfiguration.Base(b, "plan_versions");
        b.Property(x => x.Code).HasColumnName("code").HasMaxLength(40); b.Property(x => x.Name).HasColumnName("name").HasMaxLength(120);
        b.Property(x => x.Description).HasColumnName("description").HasMaxLength(2000); b.Property(x => x.Revision).HasColumnName("revision");
        b.Property(x => x.Price).HasColumnName("price").HasPrecision(18, 2); b.Property(x => x.Currency).HasColumnName("currency").HasMaxLength(3);
        b.Property(x => x.BillingPeriod).HasColumnName("billing_period").HasMaxLength(20);
        b.Property(x => x.MaxActiveStudents).HasColumnName("max_active_students"); b.Property(x => x.MaxSections).HasColumnName("max_sections");
        b.Property(x => x.Modules).HasColumnName("modules").HasColumnType("text[]"); b.HasIndex(x => new { x.Code, x.Revision }).IsUnique();
    }
}
internal sealed class InstitutionSubscriptionConfiguration : IEntityTypeConfiguration<InstitutionSubscription>
{
    public void Configure(EntityTypeBuilder<InstitutionSubscription> b)
    {
        CommercialEntityConfiguration.Base(b, "institution_subscriptions"); b.Property(x => x.TenantId).HasColumnName("tenant_id");
        b.HasAlternateKey(x => new { x.TenantId, x.Id }); b.HasIndex(x => x.TenantId).IsUnique();
        b.Property(x => x.PlanVersionId).HasColumnName("plan_version_id"); b.HasOne<PlanVersion>().WithMany().HasForeignKey(x => x.PlanVersionId).OnDelete(DeleteBehavior.Restrict);
        b.Property(x => x.StartsAtUtc).HasColumnName("starts_at_utc"); b.Property(x => x.EndsAtUtc).HasColumnName("ends_at_utc");
        b.Property(x => x.Status).HasColumnName("status").HasMaxLength(20); b.Property(x => x.Reason).HasColumnName("reason").HasMaxLength(1000); b.Property(x => x.Version).IsRowVersion();
    }
}
internal sealed class SubscriptionModuleOverrideConfiguration : IEntityTypeConfiguration<SubscriptionModuleOverride>
{
    public void Configure(EntityTypeBuilder<SubscriptionModuleOverride> b)
    {
        CommercialEntityConfiguration.Base(b, "subscription_module_overrides"); b.Property(x => x.TenantId).HasColumnName("tenant_id");
        b.Property(x => x.SubscriptionId).HasColumnName("subscription_id"); b.Property(x => x.Code).HasColumnName("code").HasMaxLength(40); b.Property(x => x.Enabled).HasColumnName("enabled");
        b.HasIndex(x => new { x.TenantId, x.Code }).IsUnique();
        b.HasOne<InstitutionSubscription>().WithMany().HasForeignKey(x => new { x.TenantId, x.SubscriptionId }).HasPrincipalKey(x => new { x.TenantId, x.Id }).OnDelete(DeleteBehavior.Restrict);
    }
}
