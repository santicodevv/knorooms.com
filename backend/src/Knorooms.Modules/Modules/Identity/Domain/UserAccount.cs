using Knorooms.SharedKernel.Domain;
using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.Identity.Domain;

/// <summary>
/// Cuenta de usuario global de KNOROOMS con credencial local (hash de contraseña)
/// y vínculo estable con el emisor de tokens de la plataforma.
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

    public string? PasswordHash { get; private set; }

    public int FailedLoginAttempts { get; private set; }

    public DateTimeOffset? LockedUntilUtc { get; private set; }

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
            return Result.Failure<UserAccount>(Error.Validation("User.InvalidSubject", "Token subject (sub) is required."));
        }

        if (string.IsNullOrWhiteSpace(issuer))
        {
            return Result.Failure<UserAccount>(Error.Validation("User.InvalidIssuer", "Token issuer (iss) is required."));
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
        bool isPlatformSupport,
        string? externalSubject = null,
        string? issuer = null)
    {
        if (!string.IsNullOrWhiteSpace(externalSubject))
        {
            ExternalSubject = externalSubject.Trim();
        }

        if (!string.IsNullOrWhiteSpace(issuer))
        {
            IdentityProviderIssuer = issuer.Trim();
        }

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

    public void SetPasswordHash(string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(passwordHash))
        {
            throw new ArgumentException("A hashed password value is required.", nameof(passwordHash));
        }

        PasswordHash = passwordHash;
        FailedLoginAttempts = 0;
        LockedUntilUtc = null;
        MarkUpdated();
    }

    public bool VerifyPassword(string password)
    {
        return PasswordHash is not null && LocalPassword.Verify(password, PasswordHash);
    }

    public bool IsLockedOut(DateTimeOffset now)
    {
        return LockedUntilUtc.HasValue && LockedUntilUtc.Value > now;
    }

    public void RegisterFailedLoginAttempt(DateTimeOffset now, int maxAttempts, TimeSpan lockoutDuration)
    {
        FailedLoginAttempts++;
        if (FailedLoginAttempts >= maxAttempts)
        {
            LockedUntilUtc = now.Add(lockoutDuration);
        }

        MarkUpdated(now);
    }

    public void ClearLoginFailures(DateTimeOffset now)
    {
        if (FailedLoginAttempts == 0 && LockedUntilUtc is null)
        {
            return;
        }

        FailedLoginAttempts = 0;
        LockedUntilUtc = null;
        MarkUpdated(now);
    }
}
