using System.Security.Cryptography;
using System.Text;

namespace Knorooms.Modules.Modules.Identity.Domain;

/// <summary>
/// Hash local de contraseñas con PBKDF2-HMAC-SHA256 en formato versionado
/// <c>pbkdf2-sha256$iteraciones$saltBase64$hashBase64</c>.
/// La contraseña en texto plano jamás se persiste ni se registra en logs o auditoría.
/// </summary>
public static class LocalPassword
{
    public const string Algorithm = "pbkdf2-sha256";

    // OWASP 2023: PBKDF2-HMAC-SHA256 ≥ 600.000 iteraciones.
    public const int DefaultIterations = 600_000;

    private const int SaltSizeBytes = 16;
    private const int HashSizeBytes = 32;
    private const int MinAllowedIterations = 10_000;
    private const int MaxAllowedIterations = 10_000_000;

    public static string Hash(string password)
    {
        ArgumentNullException.ThrowIfNull(password);

        var salt = RandomNumberGenerator.GetBytes(SaltSizeBytes);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            salt,
            DefaultIterations,
            HashAlgorithmName.SHA256,
            HashSizeBytes);

        return string.Join(
            '$',
            Algorithm,
            DefaultIterations.ToString(System.Globalization.CultureInfo.InvariantCulture),
            Convert.ToBase64String(salt),
            Convert.ToBase64String(hash));
    }

    public static bool Verify(string password, string? storedHash)
    {
        if (password is null || string.IsNullOrWhiteSpace(storedHash))
        {
            return false;
        }

        var parts = storedHash.Split('$', StringSplitOptions.None);
        if (parts.Length != 4 || !string.Equals(parts[0], Algorithm, StringComparison.Ordinal))
        {
            return false;
        }

        if (!int.TryParse(parts[1], System.Globalization.NumberStyles.None, System.Globalization.CultureInfo.InvariantCulture, out var iterations) ||
            iterations < MinAllowedIterations ||
            iterations > MaxAllowedIterations)
        {
            return false;
        }

        byte[] salt;
        byte[] expectedHash;
        try
        {
            salt = Convert.FromBase64String(parts[2]);
            expectedHash = Convert.FromBase64String(parts[3]);
        }
        catch (FormatException)
        {
            return false;
        }

        if (salt.Length == 0 || expectedHash.Length != HashSizeBytes)
        {
            return false;
        }

        var candidate = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            salt,
            iterations,
            HashAlgorithmName.SHA256,
            HashSizeBytes);

        return CryptographicOperations.FixedTimeEquals(candidate, expectedHash);
    }
}
