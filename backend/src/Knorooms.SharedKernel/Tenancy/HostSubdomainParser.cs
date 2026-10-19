using System.Text.RegularExpressions;

namespace Knorooms.SharedKernel.Tenancy;

public sealed record HostResolutionResult(
    bool IsValid,
    TenantHostKind HostKind,
    string? TenantSlug,
    string NormalizedHost,
    string? FailureReason = null)
{
    public static HostResolutionResult Invalid(string rawHost, string reason) =>
        new(false, TenantHostKind.Public, null, rawHost, reason);
}

/// <summary>
/// Resuelve el tipo de host y el subdominio institucional a partir del encabezado Host / X-Forwarded-Host.
/// El subdominio únicamente identifica el tenant solicitado; NUNCA autoriza al usuario.
/// </summary>
public static partial class HostSubdomainParser
{
    private static readonly HashSet<string> ReservedSubdomains = new(StringComparer.OrdinalIgnoreCase)
    {
        "www",
        "admin",
        "api",
        "app",
        "auth",
        "static",
        "mail",
        "cdn",
        "status",
        "support"
    };

    [GeneratedRegex("^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$", RegexOptions.CultureInvariant)]
    private static partial Regex SlugRegex();

    public static bool IsValidTenantSlug(string? slug)
    {
        if (string.IsNullOrWhiteSpace(slug))
        {
            return false;
        }

        var normalized = slug.Trim().ToLowerInvariant();
        return !ReservedSubdomains.Contains(normalized) && SlugRegex().IsMatch(normalized);
    }

    public static HostResolutionResult Resolve(
        string? rawHostHeader,
        string baseDomain = "localhost",
        string platformSubdomain = "admin")
    {
        if (string.IsNullOrWhiteSpace(rawHostHeader))
        {
            return HostResolutionResult.Invalid(string.Empty, "Host header is missing.");
        }

        // Toma solo el primer valor si viene una lista separada por comas y elimina el puerto.
        var firstHost = rawHostHeader.Split(',')[0].Trim();
        var hostWithoutPort = StripPort(firstHost).ToLowerInvariant().TrimEnd('.');

        if (string.IsNullOrWhiteSpace(hostWithoutPort))
        {
            return HostResolutionResult.Invalid(rawHostHeader, "Host header is empty after normalization.");
        }

        var normalizedBase = baseDomain.Trim().ToLowerInvariant().TrimEnd('.');
        var normalizedPlatform = platformSubdomain.Trim().ToLowerInvariant();

        if (string.Equals(hostWithoutPort, normalizedBase, StringComparison.Ordinal) ||
            string.Equals(hostWithoutPort, $"www.{normalizedBase}", StringComparison.Ordinal))
        {
            return new HostResolutionResult(true, TenantHostKind.Public, null, hostWithoutPort);
        }

        var suffix = $".{normalizedBase}";
        if (!hostWithoutPort.EndsWith(suffix, StringComparison.Ordinal))
        {
            return HostResolutionResult.Invalid(
                hostWithoutPort,
                $"Host '{hostWithoutPort}' does not belong to base domain '{normalizedBase}'.");
        }

        var subdomain = hostWithoutPort[..^suffix.Length];
        if (string.IsNullOrWhiteSpace(subdomain) || subdomain.Contains('.', StringComparison.Ordinal))
        {
            return HostResolutionResult.Invalid(
                hostWithoutPort,
                "Multi-level subdomains are not allowed.");
        }

        if (string.Equals(subdomain, normalizedPlatform, StringComparison.Ordinal))
        {
            return new HostResolutionResult(true, TenantHostKind.Platform, null, hostWithoutPort);
        }

        if (ReservedSubdomains.Contains(subdomain))
        {
            return HostResolutionResult.Invalid(
                hostWithoutPort,
                $"Subdomain '{subdomain}' is reserved by the platform.");
        }

        if (!SlugRegex().IsMatch(subdomain))
        {
            return HostResolutionResult.Invalid(
                hostWithoutPort,
                $"Subdomain '{subdomain}' does not match valid institution slug format.");
        }

        return new HostResolutionResult(true, TenantHostKind.Institution, subdomain, hostWithoutPort);
    }

    private static string StripPort(string host)
    {
        if (host.StartsWith('['))
        {
            var closingBracket = host.IndexOf(']');
            return closingBracket > 0 ? host[..(closingBracket + 1)] : host;
        }

        var colonIndex = host.IndexOf(':');
        return colonIndex >= 0 ? host[..colonIndex] : host;
    }
}
