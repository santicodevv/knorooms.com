using Knorooms.Modules.Modules.Audit.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Knorooms.Modules.Modules.Audit.Infrastructure;

internal sealed class AuditLogEntryConfiguration : IEntityTypeConfiguration<AuditLogEntry>
{
    public void Configure(EntityTypeBuilder<AuditLogEntry> builder)
    {
        builder.ToTable("audit_logs");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(x => x.TenantId)
            .HasColumnName("tenant_id");

        builder.Property(x => x.ActorUserId)
            .HasColumnName("actor_user_id");

        builder.Property(x => x.ActorAccessType)
            .HasColumnName("actor_access_type")
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.SupportAccessGrantId)
            .HasColumnName("support_access_grant_id");

        builder.Property(x => x.Action)
            .HasColumnName("action")
            .HasMaxLength(120)
            .IsRequired();

        builder.Property(x => x.ResourceType)
            .HasColumnName("resource_type")
            .HasMaxLength(80)
            .IsRequired();

        builder.Property(x => x.ResourceId)
            .HasColumnName("resource_id")
            .HasMaxLength(120)
            .IsRequired();

        builder.Property(x => x.Summary)
            .HasColumnName("summary")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(x => x.MetadataJson)
            .HasColumnName("metadata_json")
            .HasColumnType("jsonb")
            .IsRequired();

        builder.Property(x => x.CorrelationId)
            .HasColumnName("correlation_id")
            .HasMaxLength(120);

        builder.Property(x => x.CreatedAtUtc)
            .HasColumnName("created_at_utc")
            .IsRequired();

        builder.Property(x => x.UpdatedAtUtc)
            .HasColumnName("updated_at_utc");

        builder.HasIndex(x => new { x.TenantId, x.CreatedAtUtc })
            .HasDatabaseName("ix_audit_logs_tenant_created_at");

        builder.Ignore(x => x.DomainEvents);
    }
}
