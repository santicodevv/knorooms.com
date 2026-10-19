namespace Knorooms.SharedKernel.Domain;

/// <summary>
/// Representa un evento de dominio publicado dentro de una transacción de negocio.
/// Se persiste en el Transactional Outbox antes de confirmar la transacción.
/// </summary>
public interface IDomainEvent
{
    Guid EventId { get; }
    DateTimeOffset OccurredOnUtc { get; }
    Guid? TenantId { get; }
}

/// <summary>
/// Contrato obligatorio para todas las entidades que pertenecen a una institución educativa (tenant).
/// </summary>
public interface ITenantScopedEntity
{
    Guid TenantId { get; }
}

/// <summary>
/// Entidad base con identidad UUIDv7, marcas de tiempo en UTC y soporte de eventos de dominio.
/// </summary>
public abstract class Entity
{
    private readonly List<IDomainEvent> _domainEvents = [];

    public Guid Id { get; protected init; } = Guid.CreateVersion7();

    public DateTimeOffset CreatedAtUtc { get; protected init; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? UpdatedAtUtc { get; protected set; }

    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    protected void MarkUpdated(DateTimeOffset? timestampUtc = null)
    {
        UpdatedAtUtc = timestampUtc ?? DateTimeOffset.UtcNow;
    }

    protected void RaiseDomainEvent(IDomainEvent domainEvent)
    {
        ArgumentNullException.ThrowIfNull(domainEvent);
        _domainEvents.Add(domainEvent);
    }

    public void ClearDomainEvents() => _domainEvents.Clear();
}

/// <summary>
/// Entidad base para recursos pertenecientes a un colegio (tenant).
/// </summary>
public abstract class TenantScopedEntity : Entity, ITenantScopedEntity
{
    public Guid TenantId { get; protected init; }

    protected TenantScopedEntity()
    {
    }

    protected TenantScopedEntity(Guid tenantId)
    {
        if (tenantId == Guid.Empty)
        {
            throw new ArgumentException("TenantId cannot be empty for a tenant-scoped entity.", nameof(tenantId));
        }

        TenantId = tenantId;
    }
}
