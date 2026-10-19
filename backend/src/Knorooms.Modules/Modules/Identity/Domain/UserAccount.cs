using Knorooms.SharedKernel.Domain;
using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.Identity.Domain;

/// <summary>
/// Identidad federada de usuario en KNOROOMS vinculada a un sujeto OIDC externo.
/// KNOROOMS no almacena contraseñas locales; delega la autenticación a un proveedor OIDC compatible.
/// </summary>
public sealed class UserAccount : Entity
{
    public string ExternalSubject { get; private set; } = string.Empty;

    public string IdentityProviderIssuer { get; private set; } = string.Empty;

    public string Email { get; private set; } = string.Empty;

    public string DisplayName { get; private set; } = string.Empty;

    public bool IsPlatformAdmin { get; private set; }

    public bool IsPlatformSupport { get; private set; }

    public bool IsActive { get; private set; } = true;

    public DateTimeOffset? LastAuthenticatedAtUtc { get; private set; }

    public DateTimeOffset? SessionRevokedBeforeUtc { get; private set; }

    private UserAccount()
    {
    }

    public static Result<UserAccount> Create(
        string externalSubject,
        string issuer,
        string email,
        string displayName,
        bool isPlatformAdmin = false,
        bool isPlatformSupport = false,
        Guid? explicitId = null)
    {
        if (string.IsNullOrWhiteSpace(externalSubject))
        {
            return Result.Failure<UserAccount>(Error.Validation("User.InvalidSubject", "OIDC subject (sub) is required."));
        }

        if (string.IsNullOrWhiteSpace(issuer))
        {
            return Result.Failure<UserAccount>(Error.Validation("User.InvalidIssuer", "OIDC issuer (iss) is required."));
        }

        var normalizedEmail = email?.Trim().ToLowerInvariant() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(normalizedEmail) || !normalizedEmail.Contains('@', StringComparison.Ordinal))
        {
            return Result.Failure<UserAccount>(Error.Validation("User.InvalidEmail", "A valid email address is required."));
        }

        var normalizedName = string.IsNullOrWhiteSpace(displayName) ? normalizedEmail : displayName.Trim();

        return Result.Success(new UserAccount
        {
            Id = explicitId ?? Guid.CreateVersion7(),
            ExternalSubject = externalSubject.Trim(),
            IdentityProviderIssuer = issuer.Trim(),
            Email = normalizedEmail,
            DisplayName = normalizedName,
            IsPlatformAdmin = isPlatformAdmin,
            IsPlatformSupport = isPlatformSupport,
            IsActive = true,
            LastAuthenticatedAtUtc = DateTimeOffset.UtcNow
        });
    }

    public void SynchronizeFromClaims(
        string email,
        string displayName,
        bool isPlatformAdmin,
        bool isPlatformSupport)
    {
        if (!string.IsNullOrWhiteSpace(email))
        {
            Email = email.Trim().ToLowerInvariant();
        }

        if (!string.IsNullOrWhiteSpace(displayName))
        {
            DisplayName = displayName.Trim();
        }

        IsPlatformAdmin = isPlatformAdmin;
        IsPlatformSupport = isPlatformSupport;
        LastAuthenticatedAtUtc = DateTimeOffset.UtcNow;
        MarkUpdated();
    }

    public void RevokeSessionsNow()
    {
        SessionRevokedBeforeUtc = DateTimeOffset.UtcNow;
        MarkUpdated();
    }
}
