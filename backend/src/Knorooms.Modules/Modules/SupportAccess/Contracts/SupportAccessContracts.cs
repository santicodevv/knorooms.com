using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.SupportAccess.Contracts;

public sealed record SupportAccessGrantDto(
    Guid Id,
    Guid TenantId,
    Guid RequestedByUserId,
    string Reason,
    IReadOnlyList<string> Permissions,
    int DurationMinutes,
    string Status,
    DateTimeOffset RequestedAt,
    DateTimeOffset? ApprovedAt,
    DateTimeOffset? ExpiresAt,
    DateTimeOffset? RevokedAt);

public sealed record RequestSupportAccessCommand(
    Guid TenantId,
    string Reason,
    IReadOnlyList<string> Permissions,
    int DurationMinutes);

public interface ISupportAccessService
{
    Task<Result<SupportAccessGrantDto>> RequestAccessAsync(
        Guid requestedByUserId,
        RequestSupportAccessCommand command,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SupportAccessGrantDto>> ListForCurrentTenantAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SupportAccessGrantDto>> ListPlatformRequestsAsync(
        CancellationToken cancellationToken = default);

    Task<Result> ApproveAsync(
        Guid grantId,
        Guid actorUserId,
        CancellationToken cancellationToken = default);

    Task<Result> RejectAsync(
        Guid grantId,
        Guid actorUserId,
        CancellationToken cancellationToken = default);

    Task<Result> RevokeAsync(
        Guid grantId,
        Guid actorUserId,
        CancellationToken cancellationToken = default);
}
