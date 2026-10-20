namespace Knorooms.Modules.Modules.Identity.Application;

/// <summary>
/// Datos necesarios para emitir un token de acceso propio de KNOROOMS.
/// </summary>
internal sealed record AccessTokenDescriptor(
    Guid Subject,
    string Issuer,
    string Email,
    string DisplayName,
    bool IsPlatformAdmin,
    bool IsPlatformSupport,
    bool HasMultiFactor,
    DateTimeOffset IssuedAtUtc);

internal sealed record IssuedAccessToken(string Value, DateTimeOffset ExpiresAtUtc);

/// <summary>
/// Emisor interno de tokens JWT firmados con HS256 y valores opacos de refresh token.
/// </summary>
internal interface ITokenIssuer
{
    IssuedAccessToken CreateAccessToken(AccessTokenDescriptor descriptor);

    string CreateRefreshTokenValue();
}

/// <summary>
/// Tiempos de vida compartidos por el emisor y la validación de tokens.
/// </summary>
internal static class TokenLifetime
{
    public static readonly TimeSpan AccessTokenLifetime = TimeSpan.FromMinutes(15);

    public static readonly TimeSpan RefreshTokenLifetime = TimeSpan.FromDays(14);
}
