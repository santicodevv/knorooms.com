namespace Knorooms.Modules.Modules.Identity.Contracts;

/// <summary>
/// Opciones de firma/validación de los JWT propios de KNOROOMS y política de acceso.
/// Se ubica en Contracts porque la capa HTTP también valida el mismo emisor y clave.
/// </summary>
public sealed class TokenSigningOptions
{
    public const string SectionName = "Authentication:Tokens";

    public string Issuer { get; set; } = "https://knorooms.com";

    public string Audience { get; set; } = "knorooms-api";

    /// <summary>Clave simétrica en Base64 (≥ 32 bytes) usada para firmar y validar los JWT propios.</summary>
    public string SigningKey { get; set; } = string.Empty;

    public int ClockSkewSeconds { get; set; } = 30;

    public bool EnforceMfaForPrivilegedRoles { get; set; }

    public int MaxFailedLoginAttempts { get; set; } = 5;

    public int LockoutMinutes { get; set; } = 5;

    public byte[] GetSigningKeyBytes()
    {
        if (string.IsNullOrWhiteSpace(SigningKey))
        {
            throw new InvalidOperationException(
                "Authentication:Tokens:SigningKey is not configured. Provide a Base64 symmetric key of at least 32 bytes.");
        }

        byte[] key;
        try
        {
            key = Convert.FromBase64String(SigningKey.Trim());
        }
        catch (FormatException ex)
        {
            throw new InvalidOperationException(
                "Authentication:Tokens:SigningKey must be a Base64-encoded value.", ex);
        }

        if (key.Length < 32)
        {
            throw new InvalidOperationException(
                "Authentication:Tokens:SigningKey must decode to at least 32 bytes for HS256.");
        }

        return key;
    }
}

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

/// <summary>
/// Identidad validada a partir de los claims de un token de acceso emitido por KNOROOMS.
/// </summary>
public sealed record AuthenticatedPrincipal(
    string ExternalSubject,
    string Issuer,
    string Email,
    string DisplayName,
    bool IsPlatformAdmin,
    bool IsPlatformSupport,
    bool HasMultiFactorClaim,
    DateTimeOffset? IssuedAtUtc);

/// <summary>
/// Credenciales presentadas al endpoint de inicio de sesión local.
/// </summary>
public sealed record LocalLoginRequest(string Email, string Password);

/// <summary>
/// Resultado de un inicio de sesión o rotación de refresh token exitoso.
/// Los tokens son valores opacos de un solo uso que el BFF almacena cifrados; el backend nunca los expone al navegador.
/// </summary>
public sealed record IssuedTokensDto(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAtUtc,
    string RefreshToken,
    DateTimeOffset RefreshTokenExpiresAtUtc,
    Guid UserId,
    string Email,
    string DisplayName,
    bool IsPlatformAdmin,
    bool IsPlatformSupport);

public interface IIdentityService
{
    Task<Guid?> EnsureUserSynchronizedAsync(
        AuthenticatedPrincipal principal,
        CancellationToken cancellationToken = default);

    Task<CurrentUserProfileDto?> GetCurrentUserProfileAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<IssuedTokensDto?> LoginWithPasswordAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default);

    Task<IssuedTokensDto?> RefreshTokensAsync(
        string refreshToken,
        CancellationToken cancellationToken = default);

    Task RevokeRefreshTokenAsync(
        string refreshToken,
        CancellationToken cancellationToken = default);

    Task RevokeAllRefreshTokensForUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}
