using Knorooms.Modules.Modules.Tenants.Contracts;
using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.Authorization.Contracts;

public sealed record RoleSummaryDto(
    Guid Id,
    string Code,
    string Name);

public sealed record RoleDto(
    Guid Id,
    string Code,
    string Name,
    bool IsSystem,
    IReadOnlyList<string> Permissions);

public sealed record MemberDto(
    Guid MembershipId,
    Guid UserId,
    string DisplayName,
    string Email,
    string Status,
    IReadOnlyList<string> Roles,
    DateTimeOffset CreatedAt);

public sealed record TenantAccessContextDto(
    InstitutionDto Tenant,
    string AccessType,
    Guid? MembershipId,
    IReadOnlyList<RoleSummaryDto> Roles,
    IReadOnlyList<string> Permissions,
    DateTimeOffset? SupportAccessExpiresAt);

public sealed record ResolvedTenantAccess(
    bool HasAccess,
    string AccessType,
    Guid? MembershipId,
    Guid? SupportAccessGrantId,
    DateTimeOffset? SupportAccessExpiresAtUtc,
    IReadOnlyList<RoleSummaryDto> Roles,
    IReadOnlySet<string> EffectivePermissions,
    bool RequiresMultiFactor);

public interface ITenantAuthorizationService
{
    Task<ResolvedTenantAccess> ResolveUserAccessInCurrentTenantAsync(
        Guid userId,
        bool isPlatformSupportUser,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MemberDto>> ListMembersAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RoleDto>> ListRolesAsync(CancellationToken cancellationToken = default);

    Task<Result> RevokeMemberAsync(
        Guid membershipId,
        Guid actorUserId,
        CancellationToken cancellationToken = default);
}
