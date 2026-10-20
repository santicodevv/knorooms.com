namespace Knorooms.Api.Configuration;

public sealed class TenancyOptions
{
    public const string SectionName = "Tenancy";

    public string BaseDomain { get; set; } = "localhost";

    public string PlatformSubdomain { get; set; } = "admin";
}

/// <summary>
/// Reglas de la política de contraseñas para credenciales locales de KNOROOMS.
/// </summary>
public sealed class PasswordPolicyOptions
{
    public const string SectionName = "Authentication:PasswordPolicy";

    public int MinimumLength { get; set; } = 12;

    public bool RequireUppercase { get; set; } = true;

    public bool RequireLowercase { get; set; } = true;

    public bool RequireDigit { get; set; } = true;

    public bool RequireNonAlphanumeric { get; set; } = true;
}
