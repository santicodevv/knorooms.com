namespace Knorooms.Api.Configuration;

public sealed class TenancyOptions
{
    public const string SectionName = "Tenancy";

    public string BaseDomain { get; set; } = "localhost";

    public string PlatformSubdomain { get; set; } = "admin";
}

public sealed class OidcAuthenticationOptions
{
    public const string SectionName = "Authentication:Oidc";

    public string Authority { get; set; } = string.Empty;

    public string Audience { get; set; } = string.Empty;

    public bool RequireHttpsMetadata { get; set; } = true;

    public int ClockSkewSeconds { get; set; } = 30;

    public int ExpectedAccessTokenMaxLifetimeMinutes { get; set; } = 15;

    public bool EnforceMfaForPrivilegedRoles { get; set; } = false;

    public string[] AcceptedMfaClaimValues { get; set; } = ["mfa", "otp", "totp", "hwk", "swk", "urn:keycloak:acr:2fa"];
}
