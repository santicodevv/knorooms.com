using Knorooms.SharedKernel.Authorization;
using Knorooms.SharedKernel.Domain;
using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.Authorization.Domain;

public enum MembershipStatus
{
    Active = 1,
    Revoked = 2
}

/// <summary>
/// Registro persistido del catálogo central de permisos.
/// </summary>
public sealed class PermissionRecord
{
    public string Code { get; private set; } = string.Empty;

    public string Name { get; private set; } = string.Empty;

    public string Description { get; private set; } = string.Empty;

    public PermissionScope Scope { get; private set; }

    public string Module { get; private set; } = string.Empty;

    private PermissionRecord()
    {
    }

    public static PermissionRecord FromDefinition(PermissionDefinition definition) =>
        new()
        {
            Code = definition.Code,
            Name = definition.Name,
            Description = definition.Description,
            Scope = definition.Scope,
            Module = definition.Module
        };
}

/// <summary>
/// Rol dentro de una institución educativa (predefinido o personalizado por el colegio).
/// Un rol institucional jamás puede contener permisos de ámbito global (Platform).
/// </summary>
public sealed class InstitutionRole : TenantScopedEntity
{
    private readonly List<InstitutionRolePermission> _permissions = [];

    public string Code { get; private set; } = string.Empty;

    public string Name { get; private set; } = string.Empty;

    public string Description { get; private set; } = string.Empty;

    public bool IsSystemRole { get; private set; }

    public IReadOnlyCollection<InstitutionRolePermission> Permissions => _permissions.AsReadOnly();

    private InstitutionRole()
    {
    }

    public static Result<InstitutionRole> Create(
        Guid tenantId,
        string code,
        string name,
        string description,
        bool isSystemRole,
        IEnumerable<string> permissionCodes,
        Guid? explicitId = null)
    {
        if (tenantId == Guid.Empty)
        {
            return Result.Failure<InstitutionRole>(Error.Validation("Role.InvalidTenant", "TenantId is required."));
        }

        if (string.IsNullOrWhiteSpace(code) || code.Trim().Length is < 2 or > 64)
        {
            return Result.Failure<InstitutionRole>(Error.Validation("Role.InvalidCode", "Role code must be between 2 and 64 characters."));
        }

        if (string.IsNullOrWhiteSpace(name) || name.Trim().Length is < 2 or > 120)
        {
            return Result.Failure<InstitutionRole>(Error.Validation("Role.InvalidName", "Role name must be between 2 and 120 characters."));
        }

        var distinctPermissions = permissionCodes?.Distinct(StringComparer.Ordinal).ToArray() ?? [];
        foreach (var perm in distinctPermissions)
        {
            if (PermissionCatalog.IsPlatformScoped(perm))
            {
                return Result.Failure<InstitutionRole>(Error.Forbidden(
                    "Role.PlatformPermissionForbidden",
                    $"El permiso global '{perm}' no puede ser asignado a un rol institucional."));
            }

            if (!PermissionCatalog.IsInstitutionScoped(perm))
            {
                return Result.Failure<InstitutionRole>(Error.Validation(
                    "Role.UnknownPermission",
                    $"El permiso '{perm}' no existe en el catálogo institucional."));
            }
        }

        var role = new InstitutionRole
        {
            Id = explicitId ?? Guid.CreateVersion7(),
            TenantId = tenantId,
            Code = code.Trim(),
            Name = name.Trim(),
            Description = description?.Trim() ?? string.Empty,
            IsSystemRole = isSystemRole
        };

        foreach (var perm in distinctPermissions)
        {
            role._permissions.Add(new InstitutionRolePermission(tenantId, role.Id, perm));
        }

        return Result.Success(role);
    }
}

public sealed class InstitutionRolePermission : TenantScopedEntity
{
    public Guid RoleId { get; private set; }

    public string PermissionCode { get; private set; } = string.Empty;

    private InstitutionRolePermission()
    {
    }

    internal InstitutionRolePermission(Guid tenantId, Guid roleId, string permissionCode)
        : base(tenantId)
    {
        RoleId = roleId;
        PermissionCode = permissionCode;
    }
}

public sealed record MembershipRevokedDomainEvent(
    Guid EventId,
    DateTimeOffset OccurredOnUtc,
    Guid TenantId,
    Guid MembershipId,
    Guid UserId,
    string Reason) : IDomainEvent
{
    Guid? IDomainEvent.TenantId => TenantId;
}

/// <summary>
/// Membresía independiente de un usuario en una institución educativa.
/// Un mismo usuario puede tener membresías en varios colegios con roles distintos en cada uno.
/// </summary>
public sealed class TenantMembership : TenantScopedEntity
{
    private readonly List<TenantMembershipRole> _roles = [];

    public Guid UserId { get; private set; }

    public MembershipStatus Status { get; private set; } = MembershipStatus.Active;

    public DateTimeOffset? RevokedAtUtc { get; private set; }

    public Guid? RevokedByUserId { get; private set; }

    public string? RevocationReason { get; private set; }

    public IReadOnlyCollection<TenantMembershipRole> Roles => _roles.AsReadOnly();

    private TenantMembership()
    {
    }

    public static Result<TenantMembership> Create(
        Guid tenantId,
        Guid userId,
        IEnumerable<InstitutionRole> initialRoles,
        Guid? explicitId = null)
    {
        if (tenantId == Guid.Empty)
        {
            return Result.Failure<TenantMembership>(Error.Validation("Membership.InvalidTenant", "TenantId is required."));
        }

        if (userId == Guid.Empty)
        {
            return Result.Failure<TenantMembership>(Error.Validation("Membership.InvalidUser", "UserId is required."));
        }

        var roleList = initialRoles?.ToList() ?? [];
        if (roleList.Count == 0)
        {
            return Result.Failure<TenantMembership>(Error.Validation("Membership.EmptyRoles", "A membership must have at least one institutional role."));
        }

        if (roleList.Any(r => r.TenantId != tenantId))
        {
            return Result.Failure<TenantMembership>(Error.Conflict(
                "Membership.CrossTenantRoleDenied",
                "No se puede asignar un rol que pertenece a otra institución."));
        }

        var membership = new TenantMembership
        {
            Id = explicitId ?? Guid.CreateVersion7(),
            TenantId = tenantId,
            UserId = userId,
            Status = MembershipStatus.Active
        };

        foreach (var role in roleList.DistinctBy(r => r.Id))
        {
            membership._roles.Add(new TenantMembershipRole(tenantId, membership.Id, role.Id));
        }

        return Result.Success(membership);
    }

    public Result AssignRole(InstitutionRole role)
    {
        if (role.TenantId != TenantId)
        {
            return Result.Failure(Error.Conflict(
                "Membership.CrossTenantRoleDenied",
                "No se puede asignar un rol de otro colegio."));
        }

        if (_roles.Any(r => r.RoleId == role.Id))
        {
            return Result.Success();
        }

        _roles.Add(new TenantMembershipRole(TenantId, Id, role.Id));
        MarkUpdated();
        return Result.Success();
    }

    public Result Revoke(Guid revokedByUserId, string reason = "Revocado por administración institucional")
    {
        if (Status == MembershipStatus.Revoked)
        {
            return Result.Success();
        }

        Status = MembershipStatus.Revoked;
        RevokedAtUtc = DateTimeOffset.UtcNow;
        RevokedByUserId = revokedByUserId;
        RevocationReason = string.IsNullOrWhiteSpace(reason) ? "Revocado" : reason.Trim();
        MarkUpdated();

        RaiseDomainEvent(new MembershipRevokedDomainEvent(
            Guid.CreateVersion7(),
            DateTimeOffset.UtcNow,
            TenantId,
            Id,
            UserId,
            RevocationReason));

        return Result.Success();
    }

    public void Reactivate()
    {
        Status = MembershipStatus.Active;
        RevokedAtUtc = null;
        RevokedByUserId = null;
        RevocationReason = null;
        MarkUpdated();
    }
}

public sealed class TenantMembershipRole : TenantScopedEntity
{
    public Guid MembershipId { get; private set; }

    public Guid RoleId { get; private set; }

    private TenantMembershipRole()
    {
    }

    internal TenantMembershipRole(Guid tenantId, Guid membershipId, Guid roleId)
        : base(tenantId)
    {
        MembershipId = membershipId;
        RoleId = roleId;
    }
}
