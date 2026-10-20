using System.Security.Cryptography;
using System.Text;
using Knorooms.SharedKernel.Domain;
using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.Identity.Domain;

/// <summary>
/// Refresh token opaco de un solo uso. Solo se persiste el hash SHA-256 del valor;
/// el valor en claro únicamente viaja una vez en la respuesta del login/refresh al BFF.
/// La rotación obligatoria y la revocación por reutilización cortan familias de sesiones comprometidas.
/// </summary>
public sealed class RefreshToken : Entity
{
    public Guid UserId { get; private set; }

    public string TokenHash { get; private set; } = string.Empty;

    public DateTimeOffset ExpiresAtUtc { get; private set; }

    public DateTimeOffset? RevokedAtUtc { get; private set; }

    public Guid? ReplacedByTokenId { get; private set; }

    private RefreshToken()
    {
    }

    public static Result<RefreshToken> Create(
        Guid userId,
        string tokenHash,
        DateTimeOffset now,
        TimeSpan lifetime)
    {
        if (userId == Guid.Empty)
        {
            return Result.Failure<RefreshToken>(Error.Validation("RefreshToken.InvalidUser", "A valid user id is required."));
        }

        if (string.IsNullOrWhiteSpace(tokenHash))
        {
            return Result.Failure<RefreshToken>(Error.Validation("RefreshToken.InvalidHash", "A hashed refresh token value is required."));
        }

        if (lifetime <= TimeSpan.Zero)
        {
            return Result.Failure<RefreshToken>(Error.Validation("RefreshToken.InvalidLifetime", "Refresh token lifetime must be positive."));
        }

        return Result.Success(new RefreshToken
        {
            Id = Guid.CreateVersion7(),
            UserId = userId,
            TokenHash = tokenHash.Trim(),
            ExpiresAtUtc = now.Add(lifetime)
        });
    }

    public bool IsActiveAt(DateTimeOffset now)
    {
        return RevokedAtUtc is null && ExpiresAtUtc > now;
    }

    public void Revoke(DateTimeOffset now, Guid? replacedByTokenId = null)
    {
        if (RevokedAtUtc.HasValue)
        {
            return;
        }

        RevokedAtUtc = now;
        ReplacedByTokenId = replacedByTokenId;
        MarkUpdated(now);
    }

    public static string ComputeTokenHash(string tokenValue)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(tokenValue);

        var digest = SHA256.HashData(Encoding.UTF8.GetBytes(tokenValue));
        return Convert.ToHexStringLower(digest);
    }
}
