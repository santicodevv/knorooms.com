using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Audit.Domain;
using Knorooms.Modules.Modules.Authorization.Contracts;
using Knorooms.Modules.Modules.Authorization.Domain;
using Knorooms.Modules.Modules.SupportAccess.Domain;
using Knorooms.SharedKernel.Authorization;
using Knorooms.SharedKernel.Results;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace Knorooms.Modules.Modules.Authorization.Application;

internal sealed class TenantAuthorizationService(
    ApplicationDbContext dbContext,
    ITenantContextAccessor tenantContextAccessor) : ITenantAuthorizationService
{
    private static readonly HashSet<string> MfaRequiredRoleCodes = new(StringComparer.OrdinalIgnoreCase)
    {
        SystemRoleCatalog.InstitutionAdmin,
        SystemRoleCatalog.Principal
    };

    public async Task<ResolvedTenantAccess> ResolveUserAccessInCurrentTenantAsync(
        Guid userId,
        bool isPlatformSupportUser,
        CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;
        if (!scope.HasResolvedTenant || scope.TenantId is null)
        {
            return EmptyAccess();
        }

        var tenantId = scope.TenantId.Value;

        // 1. Verificar membresía institucional activa en el colegio actual.
        var membership = await dbContext.TenantMemberships
            .AsNoTracking()
            .Include(m => m.Roles)
            .FirstOrDefaultAsync(
                m => m.TenantId == tenantId &&
                     m.UserId == userId &&
                     m.Status == MembershipStatus.Active,
                cancellationToken);

        if (membership is not null)
        {
            var roleIds = membership.Roles.Select(r => r.RoleId).ToArray();
            var roles = await dbContext.InstitutionRoles
                .AsNoTracking()
                .Include(r => r.Permissions)
                .Where(r => r.TenantId == tenantId && roleIds.Contains(r.Id))
                .ToListAsync(cancellationToken);

            var roleSummaries = roles
                .Select(r => new RoleSummaryDto(r.Id, r.Code, r.Name))
                .ToList();

            var permissions = roles
                .SelectMany(r => r.Permissions)
                .Select(p => p.PermissionCode)
                .Where(PermissionCatalog.IsInstitutionScoped)
                .ToHashSet(StringComparer.Ordinal);

            var requiresMfa = roles.Any(r => MfaRequiredRoleCodes.Contains(r.Code));

            return new ResolvedTenantAccess(
                HasAccess: true,
                AccessType: nameof(TenantAccessType.Member),
                MembershipId: membership.Id,
                SupportAccessGrantId: null,
                SupportAccessExpiresAtUtc: null,
                Roles: roleSummaries,
                EffectivePermissions: permissions,
                RequiresMultiFactor: requiresMfa);
        }

        // 2. Si no es miembro pero pertenece a soporte global, comprobar si existe una concesión temporal aprobada y vigente.
        if (isPlatformSupportUser)
        {
            var now = DateTimeOffset.UtcNow;
            var activeGrant = await dbContext.SupportAccessGrants
                .AsNoTracking()
                .Where(g =>
                    g.TenantId == tenantId &&
                    g.RequestedByUserId == userId &&
                    g.Status == SupportAccessStatus.Approved &&
                    g.ExpiresAtUtc != null &&
                    g.ExpiresAtUtc > now &&
                    g.RevokedAtUtc == null)
                .OrderByDescending(g => g.ExpiresAtUtc)
                .FirstOrDefaultAsync(cancellationToken);

            if (activeGrant is not null)
            {
                var supportPermissions = activeGrant.Permissions
                    .Where(PermissionCatalog.IsInstitutionScoped)
                    .ToHashSet(StringComparer.Ordinal);

                supportPermissions.Add(PermissionCatalog.InstitutionContextRead);

                return new ResolvedTenantAccess(
                    HasAccess: true,
                    AccessType: nameof(TenantAccessType.Support),
                    MembershipId: null,
                    SupportAccessGrantId: activeGrant.Id,
                    SupportAccessExpiresAtUtc: activeGrant.ExpiresAtUtc,
                    Roles: [new RoleSummaryDto(Guid.Empty, SystemRoleCatalog.PlatformSupportAgent, "Soporte técnico temporal")],
                    EffectivePermissions: supportPermissions,
                    RequiresMultiFactor: true);
            }
        }

        return EmptyAccess();
    }

    public async Task<IReadOnlyList<MemberDto>> ListMembersAsync(CancellationToken cancellationToken = default)
    {
        var tenantId = tenantContextAccessor.Current.TenantId;
        if (tenantId is null)
        {
            return [];
        }

        var memberships = await dbContext.TenantMemberships
            .AsNoTracking()
            .Include(m => m.Roles)
            .Where(m => m.TenantId == tenantId.Value)
            .OrderByDescending(m => m.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        var userIds = memberships.Select(m => m.UserId).Distinct().ToArray();
        var users = await dbContext.Users
            .AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, cancellationToken);

        var rolesById = await dbContext.InstitutionRoles
            .AsNoTracking()
            .Where(r => r.TenantId == tenantId.Value)
            .ToDictionaryAsync(r => r.Id, r => r.Code, cancellationToken);

        return memberships
            .Select(m =>
            {
                users.TryGetValue(m.UserId, out var user);
                var roleCodes = m.Roles
                    .Select(mr => rolesById.TryGetValue(mr.RoleId, out var code) ? code : null)
                    .Where(code => code is not null)
                    .Cast<string>()
                    .OrderBy(code => code, StringComparer.Ordinal)
                    .ToList();

                return new MemberDto(
                    m.Id,
                    m.UserId,
                    user?.DisplayName ?? "Usuario",
                    user?.Email ?? string.Empty,
                    m.Status.ToString(),
                    roleCodes,
                    m.CreatedAtUtc);
            })
            .ToList();
    }

    public async Task<IReadOnlyList<RoleDto>> ListRolesAsync(CancellationToken cancellationToken = default)
    {
        var tenantId = tenantContextAccessor.Current.TenantId;
        if (tenantId is null)
        {
            return [];
        }

        var roles = await dbContext.InstitutionRoles
            .AsNoTracking()
            .Include(r => r.Permissions)
            .Where(r => r.TenantId == tenantId.Value)
            .OrderBy(r => r.Code)
            .ToListAsync(cancellationToken);

        return roles
            .Select(r => new RoleDto(
                r.Id,
                r.Code,
                r.Name,
                r.IsSystemRole,
                r.Permissions.Select(p => p.PermissionCode).OrderBy(p => p, StringComparer.Ordinal).ToList()))
            .ToList();
    }

    public async Task<Result> UpdateRolePermissionsAsync(
        Guid roleId, IReadOnlyList<string> permissions, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;
        if (scope.TenantId is not Guid tenantId || scope.UserId != actorUserId)
        {
            return Result.Failure(Error.Forbidden("Role.TenantRequired", "Se requiere una membresía activa en el colegio."));
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        await dbContext.LockCommercialTenantAsync(tenantId, cancellationToken);
        var access = await ResolveUserAccessInCurrentTenantAsync(actorUserId, false, cancellationToken);
        if (!access.Roles.Any(role => role.Code == SystemRoleCatalog.InstitutionAdmin) ||
            !access.EffectivePermissions.Contains(PermissionCatalog.InstitutionRolesManage))
        {
            return Result.Failure(Error.Forbidden("Role.AdminRequired", "Solo la administración institucional puede editar permisos."));
        }

        if (permissions.Any(code => code is null || !PermissionCatalog.IsInstitutionScoped(code)))
        {
            return Result.Failure(Error.Validation("Role.InvalidPermission", "Seleccione únicamente permisos institucionales del catálogo."));
        }

        var role = await dbContext.InstitutionRoles.Include(x => x.Permissions)
            .SingleOrDefaultAsync(x => x.TenantId == tenantId && x.Id == roleId, cancellationToken);
        if (role is null)
        {
            return Result.Failure(Error.NotFound("Role.NotFound", "El rol no existe en este colegio."));
        }

        if (role.Code == SystemRoleCatalog.Guardian)
        {
            return Result.Failure(Error.Forbidden("Role.GuardianUnavailable", "El rol familiar se habilitará con el portal de familias."));
        }

        var requested = permissions.ToHashSet(StringComparer.Ordinal);
        var previous = role.Permissions.Select(permission => permission.PermissionCode).ToHashSet(StringComparer.Ordinal);
        if (requested.Except(previous).Any(code => !access.EffectivePermissions.Contains(code) && role.Code != SystemRoleCatalog.InstitutionAdmin))
        {
            return Result.Failure(Error.Forbidden("Role.PermissionDenied", "No puede delegar permisos que no tiene."));
        }

        if (role.Code == SystemRoleCatalog.InstitutionAdmin &&
            (!requested.Contains(PermissionCatalog.InstitutionContextRead) ||
             !requested.Contains(PermissionCatalog.InstitutionRolesRead) ||
             !requested.Contains(PermissionCatalog.InstitutionRolesManage)))
        {
            return Result.Failure(Error.Conflict("Role.RequiredPermissions", "La administración debe conservar el acceso al editor de roles."));
        }

        if (previous.SetEquals(requested))
        {
            return Result.Success();
        }

        role.ReplacePermissions(requested);
        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId, actorUserId, scope.AccessType.ToString(), scope.SupportAccessGrantId,
            "institution.role.permissions.updated", nameof(InstitutionRole), role.Id.ToString(),
            "Se actualizaron los permisos del rol.",
            new Dictionary<string, string?>
            {
                ["added"] = string.Join(", ", requested.Except(previous).Order(StringComparer.Ordinal)),
                ["removed"] = string.Join(", ", previous.Except(requested).Order(StringComparer.Ordinal))
            }));
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Result.Success();
    }

    public async Task<Result> RevokeMemberAsync(
        Guid membershipId,
        Guid actorUserId,
        CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;
        if (scope.TenantId is null)
        {
            return Result.Failure(Error.Forbidden("Tenant.NotResolved", "No hay un contexto institucional activo."));
        }

        var membership = await dbContext.TenantMemberships
            .FirstOrDefaultAsync(
                m => m.TenantId == scope.TenantId.Value && m.Id == membershipId,
                cancellationToken);

        if (membership is null)
        {
            return Result.Failure(Error.NotFound("Membership.NotFound", "La membresía solicitada no existe en esta institución."));
        }

        if (membership.UserId == actorUserId)
        {
            return Result.Failure(Error.Conflict("Membership.CannotRevokeSelf", "Un administrador no puede revocar su propia membresía activa."));
        }

        var result = membership.Revoke(actorUserId);
        if (result.IsFailure)
        {
            return result;
        }

        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: scope.TenantId.Value,
            actorUserId: actorUserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: scope.SupportAccessGrantId,
            action: "institution.membership.revoked",
            resourceType: "TenantMembership",
            resourceId: membership.Id.ToString(),
            summary: $"Membresía {membership.Id} del usuario {membership.UserId} revocada."));

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    private static ResolvedTenantAccess EmptyAccess() =>
        new(
            HasAccess: false,
            AccessType: nameof(TenantAccessType.None),
            MembershipId: null,
            SupportAccessGrantId: null,
            SupportAccessExpiresAtUtc: null,
            Roles: [],
            EffectivePermissions: new HashSet<string>(StringComparer.Ordinal),
            RequiresMultiFactor: false);
}
