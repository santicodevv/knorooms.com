namespace Knorooms.Modules.Modules.Identity.Contracts;

public sealed record UserMembershipSummaryDto(
    Guid MembershipId,
    Guid TenantId,
    string TenantSlug,
    string TenantName,
    string Status);

public sealed record CurrentUserProfileDto(
    Guid UserId,
    string DisplayName,
    string Email,
    IReadOnlyList<string> PlatformRoles,
    IReadOnlyList<UserMembershipSummaryDto> Memberships);

public sealed record OidcAuthenticatedPrincipal(
    string ExternalSubject,
    string Issuer,
    string Email,
    string DisplayName,
    bool IsPlatformAdmin,
    bool IsPlatformSupport,
    bool HasMultiFactorClaim,
    DateTimeOffset? IssuedAtUtc);

public interface IIdentityService
{
    Task<Guid?> EnsureUserSynchronizedAsync(
        OidcAuthenticatedPrincipal principal,
        CancellationToken cancellationToken = default);

    Task<CurrentUserProfileDto?> GetCurrentUserProfileAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}
