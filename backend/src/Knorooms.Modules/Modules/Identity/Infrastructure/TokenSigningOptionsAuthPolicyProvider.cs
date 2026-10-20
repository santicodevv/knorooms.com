using Knorooms.Modules.Modules.Identity.Application;
using Knorooms.Modules.Modules.Identity.Contracts;
using Microsoft.Extensions.Options;

namespace Knorooms.Modules.Modules.Identity.Infrastructure;

internal sealed class TokenSigningOptionsAuthPolicyProvider(IOptions<TokenSigningOptions> options)
    : IIdentityAuthPolicyProvider
{
    public IdentityAuthPolicy Get()
    {
        var value = options.Value;
        return new IdentityAuthPolicy(
            Issuer: value.Issuer,
            EnforceMfaForPrivilegedRoles: value.EnforceMfaForPrivilegedRoles,
            MaxFailedLoginAttempts: Math.Clamp(value.MaxFailedLoginAttempts, 1, 100),
            LockoutDuration: TimeSpan.FromMinutes(Math.Clamp(value.LockoutMinutes, 1, 1440)));
    }
}
