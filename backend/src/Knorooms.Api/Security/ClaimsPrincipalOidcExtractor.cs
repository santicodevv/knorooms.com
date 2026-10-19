using System.Security.Claims;
using System.Text.Json;
using Knorooms.Api.Configuration;
using Knorooms.SharedKernel.Authorization;
using Microsoft.Extensions.Options;

namespace Knorooms.Api.Security;

public sealed class AuthenticatedRequestIdentity
{
    public required Guid UserId { get; init; }
    public required string Email { get; init; }
    public required string DisplayName { get; init; }
    public required bool IsPlatformAdmin { get; init; }
    public required bool IsPlatformSupport { get; init; }
    public required bool HasMultiFactorAuthentication { get; init; }
}

public static class ClaimsPrincipalOidcExtractor
{
    public static bool HasMultiFactorClaim(ClaimsPrincipal principal, OidcAuthenticationOptions options)
    {
        var accepted = new HashSet<string>(options.AcceptedMfaClaimValues, StringComparer.OrdinalIgnoreCase);

        foreach (var claim in principal.Claims)
        {
            if (claim.Type is "amr" or "acr" or "http://schemas.microsoft.com/claims/authnmethodsreferences")
            {
                if (accepted.Contains(claim.Value))
                {
                    return true;
                }

                if (claim.Value.StartsWith('['))
                {
                    try
                    {
                        var values = JsonSerializer.Deserialize<string[]>(claim.Value);
                        if (values is not null && values.Any(accepted.Contains))
                        {
                            return true;
                        }
                    }
                    catch
                    {
                        // Ignorar formato JSON malformado en claim amr.
                    }
                }
            }
        }

        return false;
    }

    public static (bool IsPlatformAdmin, bool IsPlatformSupport) ExtractPlatformRoleFlags(ClaimsPrincipal principal)
    {
        var roles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var claim in principal.Claims)
        {
            if (claim.Type is ClaimTypes.Role or "role" or "roles" or "platform_roles")
            {
                roles.Add(claim.Value);
            }
            else if (claim.Type == "realm_access" && claim.Value.Contains("roles", StringComparison.Ordinal))
            {
                try
                {
                    using var doc = JsonDocument.Parse(claim.Value);
                    if (doc.RootElement.TryGetProperty("roles", out var rolesElement) &&
                        rolesElement.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var item in rolesElement.EnumerateArray())
                        {
                            if (item.GetString() is { } r)
                            {
                                roles.Add(r);
                            }
                        }
                    }
                }
                catch
                {
                    // Ignorar JSON inválido.
                }
            }
        }

        return (
            IsPlatformAdmin: roles.Contains(SystemRoleCatalog.PlatformSuperAdmin),
            IsPlatformSupport: roles.Contains(SystemRoleCatalog.PlatformSupportAgent));
    }
}
