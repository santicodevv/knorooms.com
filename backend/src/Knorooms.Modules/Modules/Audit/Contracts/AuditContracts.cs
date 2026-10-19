namespace Knorooms.Modules.Modules.Audit.Contracts;

public sealed record AuditLogEntryDto(
    Guid Id,
    Guid? TenantId,
    Guid? ActorUserId,
    string ActorAccessType,
    Guid? SupportAccessGrantId,
    string Action,
    string ResourceType,
    string ResourceId,
    string Summary,
    DateTimeOffset CreatedAtUtc);

public interface IAuditQueryService
{
    Task<IReadOnlyList<AuditLogEntryDto>> ListForCurrentTenantAsync(
        int limit = 50,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditLogEntryDto>> ListForPlatformAsync(
        int limit = 50,
        CancellationToken cancellationToken = default);
}
