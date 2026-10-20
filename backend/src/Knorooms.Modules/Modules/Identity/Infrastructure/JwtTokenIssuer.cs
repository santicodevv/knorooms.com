using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Knorooms.Modules.Modules.Identity.Application;
using Knorooms.Modules.Modules.Identity.Contracts;
using Microsoft.Extensions.Options;

namespace Knorooms.Modules.Modules.Identity.Infrastructure;

/// <summary>
/// Emisor de tokens de KNOROOMS. Firma JWT con HS256 usando la clave simétrica
/// configurada (Base64, ≥ 32 bytes) y genera refresh tokens opacos de 256 bits.
/// </summary>
internal sealed class JwtTokenIssuer : ITokenIssuer
{
    private readonly TokenSigningOptions _options;
    private readonly byte[] _signingKey;

    public JwtTokenIssuer(IOptions<TokenSigningOptions> options)
    {
        _options = options.Value;
        _signingKey = _options.GetSigningKeyBytes();
    }

    public IssuedAccessToken CreateAccessToken(AccessTokenDescriptor descriptor)
    {
        var issuedAt = descriptor.IssuedAtUtc.ToUnixTimeSeconds();
        var expiresAt = descriptor.IssuedAtUtc.Add(TokenLifetime.AccessTokenLifetime);
        var expiresUnix = expiresAt.ToUnixTimeSeconds();
        var subject = descriptor.Subject.ToString("D");

        var header = new Dictionary<string, object>(StringComparer.Ordinal)
        {
            ["alg"] = "HS256",
            ["typ"] = "JWT"
        };

        var payload = new Dictionary<string, object>(StringComparer.Ordinal)
        {
            ["iss"] = descriptor.Issuer,
            ["sub"] = subject,
            ["aud"] = _options.Audience,
            ["iat"] = issuedAt,
            ["nbf"] = issuedAt,
            ["exp"] = expiresUnix,
            ["email"] = descriptor.Email,
            ["name"] = descriptor.DisplayName
        };

        if (descriptor.IsPlatformAdmin || descriptor.IsPlatformSupport)
        {
            var roles = new List<string>(2);
            if (descriptor.IsPlatformAdmin)
            {
                roles.Add("PlatformAdmin");
            }

            if (descriptor.IsPlatformSupport)
            {
                roles.Add("PlatformSupport");
            }

            payload["roles"] = roles.ToArray();
        }

        if (descriptor.HasMultiFactor)
        {
            // Método de autenticación registrado ("pwd" por credencial local).
            payload["amr"] = new[] { "pwd" };
        }

        var encodedHeader = Base64UrlEncode(JsonSerializer.SerializeToUtf8Bytes(header));
        var encodedPayload = Base64UrlEncode(JsonSerializer.SerializeToUtf8Bytes(payload));
        var signingInput = $"{encodedHeader}.{encodedPayload}";

        var signature = HMACSHA256.HashData(_signingKey, Encoding.ASCII.GetBytes(signingInput));
        var token = $"{signingInput}.{Base64UrlEncode(signature)}";

        return new IssuedAccessToken(token, expiresAt);
    }

    public string CreateRefreshTokenValue()
    {
        return Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
    }

    private static string Base64UrlEncode(byte[] value)
    {
        return Convert.ToBase64String(value)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }
}

