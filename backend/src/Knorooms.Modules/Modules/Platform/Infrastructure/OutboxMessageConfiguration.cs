using Knorooms.Modules.Modules.Platform.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Knorooms.Modules.Modules.Platform.Infrastructure;

internal sealed class OutboxMessageConfiguration : IEntityTypeConfiguration<OutboxMessage>
{
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.ToTable("outbox_messages");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(x => x.TenantId)
            .HasColumnName("tenant_id");

        builder.Property(x => x.EventType)
            .HasColumnName("event_type")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(x => x.PayloadJson)
            .HasColumnName("payload_json")
            .HasColumnType("jsonb")
            .IsRequired();

        builder.Property(x => x.OccurredOnUtc)
            .HasColumnName("occurred_on_utc")
            .IsRequired();

        builder.Property(x => x.ProcessedOnUtc)
            .HasColumnName("processed_on_utc");

        builder.Property(x => x.AttemptCount)
            .HasColumnName("attempt_count")
            .IsRequired();

        builder.Property(x => x.LastError)
            .HasColumnName("last_error")
            .HasMaxLength(1000);

        builder.HasIndex(x => new { x.ProcessedOnUtc, x.OccurredOnUtc })
            .HasDatabaseName("ix_outbox_messages_unprocessed");
    }
}
