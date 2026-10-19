using Knorooms.SharedKernel.Authorization;
using Knorooms.SharedKernel.Domain;
using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.SupportAccess.Domain;

public enum SupportAccessStatus
{
    Requested = 1,
    Approved = 2,
    Rejected = 3,
    Revoked = 4
}

public sealed record SupportAccessStatusChangedDomainEvent(
    Guid EventId,
    DateTimeOffset OccurredOnUtc,
    Guid TenantId,
    Guid GrantId,
    SupportAccessStatus Status) : IDomainEvent
{
    Guid? IDomainEvent.TenantId => TenantId;
}

/// <summary>
/// Concesión temporal, acotada y aprobada por la institución para personal de soporte de KNOROOMS.
/// Prohibido otorgar permisos globales o modificar calificaciones/boletines publicados.
/// </summary>
public sealed class SupportAccessGrant : TenantScopedEntity
{
    public const int MaxDurationMinutes = 480; // 8 horas máximo

    private static readonly HashSet<string> ProhibitedSupportPermissions = new(StringComparer.Ordinal)
    {
        PermissionCatalog.InstitutionGradingApprove,
        PermissionCatalog.InstitutionReportCardsPublish,
        PermissionCatalog.InstitutionSupportAccessManage
    };

    public Guid RequestedByUserId { get; private set; }

    public string Reason { get; private set; } = string.Empty;

    public string[] Permissions { get; private set; } = [];

    public int DurationMinutes { get; private set; }

    public SupportAccessStatus Status { get; private set; } = SupportAccessStatus.Requested;

    public DateTimeOffset RequestedAtUtc { get; private set; }

    public Guid? ApprovedByUserId { get; private set; }

    public DateTimeOffset? ApprovedAtUtc { get; private set; }

    public DateTimeOffset? ExpiresAtUtc { get; private set; }

    public Guid? RejectedByUserId { get; private set; }

    public DateTimeOffset? RejectedAtUtc { get; private set; }

    public Guid? RevokedByUserId { get; private set; }

    public DateTimeOffset? RevokedAtUtc { get; private set; }

    private SupportAccessGrant()
    {
    }

    public static Result<SupportAccessGrant> Request(
        Guid tenantId,
        Guid requestedByUserId,
        string reason,
        IEnumerable<string> requestedPermissions,
        int durationMinutes)
    {
        if (tenantId == Guid.Empty)
        {
            return Result.Failure<SupportAccessGrant>(Error.Validation("SupportAccess.InvalidTenant", "TenantId is required."));
        }

        if (requestedByUserId == Guid.Empty)
        {
            return Result.Failure<SupportAccessGrant>(Error.Validation("SupportAccess.InvalidRequester", "RequestedByUserId is required."));
        }

        var trimmedReason = reason?.Trim() ?? string.Empty;
        if (trimmedReason.Length is < 10 or > 500)
        {
            return Result.Failure<SupportAccessGrant>(Error.Validation(
                "SupportAccess.InvalidReason",
                "El motivo de soporte debe tener entre 10 y 500 caracteres."));
        }

        if (durationMinutes is < 15 or > MaxDurationMinutes)
        {
            return Result.Failure<SupportAccessGrant>(Error.Validation(
                "SupportAccess.InvalidDuration",
                $"La duración del acceso temporal debe estar entre 15 y {MaxDurationMinutes} minutos."));
        }

        var distinctPermissions = requestedPermissions?.Distinct(StringComparer.Ordinal).ToArray() ?? [];
        if (distinctPermissions.Length == 0)
        {
            return Result.Failure<SupportAccessGrant>(Error.Validation(
                "SupportAccess.EmptyPermissions",
                "Debe solicitar al menos un permiso institucional acotado."));
        }

        foreach (var permission in distinctPermissions)
        {
            if (!PermissionCatalog.IsInstitutionScoped(permission))
            {
                return Result.Failure<SupportAccessGrant>(Error.Forbidden(
                    "SupportAccess.NonInstitutionPermission",
                    $"El permiso '{permission}' no es un permiso institucional válido."));
            }

            if (ProhibitedSupportPermissions.Contains(permission))
            {
                return Result.Failure<SupportAccessGrant>(Error.Forbidden(
                    "SupportAccess.ProhibitedPermission",
                    $"El personal de soporte no puede solicitar el permiso '{permission}'."));
            }
        }

        var now = DateTimeOffset.UtcNow;
        var grant = new SupportAccessGrant
        {
            Id = Guid.CreateVersion7(),
            TenantId = tenantId,
            RequestedByUserId = requestedByUserId,
            Reason = trimmedReason,
            Permissions = distinctPermissions,
            DurationMinutes = durationMinutes,
            Status = SupportAccessStatus.Requested,
            RequestedAtUtc = now,
            CreatedAtUtc = now
        };

        grant.RaiseDomainEvent(new SupportAccessStatusChangedDomainEvent(
            Guid.CreateVersion7(),
            now,
            tenantId,
            grant.Id,
            grant.Status));

        return Result.Success(grant);
    }

    public Result Approve(Guid approvedByUserId, DateTimeOffset? nowUtc = null)
    {
        if (Status != SupportAccessStatus.Requested)
        {
            return Result.Failure(Error.Conflict(
                "SupportAccess.InvalidStateTransition",
                "Solo pueden aprobarse solicitudes en estado pendiente (Requested)."));
        }

        var now = nowUtc ?? DateTimeOffset.UtcNow;
        Status = SupportAccessStatus.Approved;
        ApprovedByUserId = approvedByUserId;
        ApprovedAtUtc = now;
        ExpiresAtUtc = now.AddMinutes(DurationMinutes);
        MarkUpdated(now);

        RaiseDomainEvent(new SupportAccessStatusChangedDomainEvent(
            Guid.CreateVersion7(),
            now,
            TenantId,
            Id,
            Status));

        return Result.Success();
    }

    public Result Reject(Guid rejectedByUserId, DateTimeOffset? nowUtc = null)
    {
        if (Status != SupportAccessStatus.Requested)
        {
            return Result.Failure(Error.Conflict(
                "SupportAccess.InvalidStateTransition",
                "Solo pueden rechazarse solicitudes en estado pendiente (Requested)."));
        }

        var now = nowUtc ?? DateTimeOffset.UtcNow;
        Status = SupportAccessStatus.Rejected;
        RejectedByUserId = rejectedByUserId;
        RejectedAtUtc = now;
        MarkUpdated(now);

        RaiseDomainEvent(new SupportAccessStatusChangedDomainEvent(
            Guid.CreateVersion7(),
            now,
            TenantId,
            Id,
            Status));

        return Result.Success();
    }

    public Result Revoke(Guid revokedByUserId, DateTimeOffset? nowUtc = null)
    {
        if (Status != SupportAccessStatus.Approved)
        {
            return Result.Failure(Error.Conflict(
                "SupportAccess.InvalidStateTransition",
                "Solo pueden revocarse concesiones previamente aprobadas."));
        }

        var now = nowUtc ?? DateTimeOffset.UtcNow;
        Status = SupportAccessStatus.Revoked;
        RevokedByUserId = revokedByUserId;
        RevokedAtUtc = now;
        MarkUpdated(now);

        RaiseDomainEvent(new SupportAccessStatusChangedDomainEvent(
            Guid.CreateVersion7(),
            now,
            TenantId,
            Id,
            Status));

        return Result.Success();
    }

    public bool IsCurrentlyActive(DateTimeOffset nowUtc) =>
        Status == SupportAccessStatus.Approved &&
        ExpiresAtUtc.HasValue &&
        ExpiresAtUtc.Value > nowUtc &&
        RevokedAtUtc is null;
}
