using System.Text.Json;
using Knorooms.SharedKernel.Domain;

namespace Knorooms.Modules.Modules.Platform.Domain;

/// <summary>
/// Mensaje del Transactional Outbox persistido dentro de la misma transacción de negocio
/// antes de cualquier publicación o efecto secundario asíncrono.
/// </summary>
public sealed class OutboxMessage
{
    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public Guid? TenantId { get; private set; }

    public string EventType { get; private set; } = string.Empty;

    public string PayloadJson { get; private set; } = "{}";

    public DateTimeOffset OccurredOnUtc { get; private set; }

    public DateTimeOffset? ProcessedOnUtc { get; private set; }

    public int AttemptCount { get; private set; }

    public string? LastError { get; private set; }

    private OutboxMessage()
    {
    }

    public static OutboxMessage FromDomainEvent(IDomainEvent domainEvent)
    {
        ArgumentNullException.ThrowIfNull(domainEvent);

        return new OutboxMessage
        {
            Id = domainEvent.EventId == Guid.Empty ? Guid.CreateVersion7() : domainEvent.EventId,
            TenantId = domainEvent.TenantId,
            EventType = domainEvent.GetType().FullName ?? domainEvent.GetType().Name,
            PayloadJson = JsonSerializer.Serialize(domainEvent, domainEvent.GetType()),
            OccurredOnUtc = domainEvent.OccurredOnUtc,
            AttemptCount = 0
        };
    }

    public void MarkProcessed(DateTimeOffset processedAtUtc)
    {
        ProcessedOnUtc = processedAtUtc;
        LastError = null;
    }

    public void MarkFailed(string error)
    {
        AttemptCount++;
        LastError = error.Length > 1000 ? error[..1000] : error;
    }
}
