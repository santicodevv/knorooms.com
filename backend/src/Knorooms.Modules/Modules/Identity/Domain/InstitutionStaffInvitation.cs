using System.Net.Mail;
using Knorooms.SharedKernel.Domain;
using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.Identity.Domain;

public sealed class InstitutionStaffInvitation : TenantScopedEntity
{
    private readonly List<InstitutionStaffInvitationRole> _roles = [];

    public string Email { get; private set; } = string.Empty;

    public string TokenHash { get; private set; } = string.Empty;

    public DateTimeOffset ExpiresAtUtc { get; private set; }

    public DateTimeOffset? AcceptedAtUtc { get; private set; }

    public DateTimeOffset? RevokedAtUtc { get; private set; }

    public string DeliveryStatus { get; private set; } = "Queued";

    public IReadOnlyCollection<InstitutionStaffInvitationRole> Roles =>
        _roles.AsReadOnly();

    private InstitutionStaffInvitation()
    {
    }

    public static Result<InstitutionStaffInvitation> Create(
        Guid tenantId,
        string email,
        string tokenHash,
        IEnumerable<Guid> roleIds,
        Guid? explicitId = null,
        DateTimeOffset? nowUtc = null)
    {
        if (tenantId == Guid.Empty)
        {
            return Result.Failure<InstitutionStaffInvitation>(
                Error.Validation("StaffInvitation.InvalidTenant", "TenantId is required."));
        }

        var normalizedEmail = email?.Trim().ToLowerInvariant() ?? string.Empty;

        if (!MailAddress.TryCreate(normalizedEmail, out var parsedEmail) ||
            !string.Equals(parsedEmail.Address, normalizedEmail, StringComparison.OrdinalIgnoreCase))
        {
            return Result.Failure<InstitutionStaffInvitation>(
                Error.Validation("StaffInvitation.InvalidEmail", "A valid email is required."));
        }

        if (string.IsNullOrWhiteSpace(tokenHash) ||
            tokenHash.Length != 64 ||
            !tokenHash.All(Uri.IsHexDigit))
        {
            return Result.Failure<InstitutionStaffInvitation>(
                Error.Validation("StaffInvitation.InvalidTokenHash", "A valid SHA-256 token hash is required."));
        }

        var distinctRoleIds = roleIds?.Distinct().ToArray() ?? [];

        if (distinctRoleIds.Length == 0 || distinctRoleIds.Any(id => id == Guid.Empty))
        {
            return Result.Failure<InstitutionStaffInvitation>(
                Error.Validation("StaffInvitation.InvalidRoles", "At least one valid role is required."));
        }

        var now = nowUtc ?? DateTimeOffset.UtcNow;

        var invitation = new InstitutionStaffInvitation
        {
            Id = explicitId ?? Guid.CreateVersion7(),
            TenantId = tenantId,
            Email = normalizedEmail,
            TokenHash = tokenHash.ToLowerInvariant(),
            ExpiresAtUtc = now.AddHours(48),
            DeliveryStatus = "Queued"
        };

        foreach (var roleId in distinctRoleIds)
        {
            invitation._roles.Add(
                new InstitutionStaffInvitationRole(tenantId, invitation.Id, roleId));
        }

        return Result.Success(invitation);
    }

    public Result Accept(DateTimeOffset? nowUtc = null)
    {
        var now = nowUtc ?? DateTimeOffset.UtcNow;

        if (AcceptedAtUtc is not null)
        {
            return Result.Failure(Error.Conflict(
                "StaffInvitation.AlreadyAccepted", "This invitation has already been accepted."));
        }

        if (RevokedAtUtc is not null)
        {
            return Result.Failure(Error.Conflict(
                "StaffInvitation.Revoked", "This invitation has been revoked."));
        }

        if (ExpiresAtUtc <= now)
        {
            return Result.Failure(Error.Conflict(
                "StaffInvitation.Expired", "This invitation has expired."));
        }

        AcceptedAtUtc = now;
        MarkUpdated(now);

        return Result.Success();
    }

    public Result Revoke(DateTimeOffset? nowUtc = null)
    {
        if (AcceptedAtUtc is not null)
        {
            return Result.Failure(Error.Conflict(
                "StaffInvitation.AlreadyAccepted", "An accepted invitation cannot be revoked."));
        }

        if (RevokedAtUtc is not null)
        {
            return Result.Success();
        }

        RevokedAtUtc = nowUtc ?? DateTimeOffset.UtcNow;
        MarkUpdated(RevokedAtUtc);

        return Result.Success();
    }

    public void SetDeliveryStatus(string status)
    {
        if (status is not ("Queued" or "Sent" or "Failed"))
        {
            throw new ArgumentException("Invalid invitation delivery status.", nameof(status));
        }

        DeliveryStatus = status;
        MarkUpdated();
    }
}

public sealed class InstitutionStaffInvitationRole : TenantScopedEntity
{
    public Guid InvitationId { get; private set; }

    public Guid RoleId { get; private set; }

    private InstitutionStaffInvitationRole()
    {
    }

    internal InstitutionStaffInvitationRole(
        Guid tenantId,
        Guid invitationId,
        Guid roleId)
        : base(tenantId)
    {
        InvitationId = invitationId;
        RoleId = roleId;
    }
}
