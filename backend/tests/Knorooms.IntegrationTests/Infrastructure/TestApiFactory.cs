using System.Globalization;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Knorooms.IntegrationTests.Infrastructure;

public sealed class TestOidcAuthHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "TestOidcBearer";
    public const string SubjectHeader = "X-Test-Oidc-Sub";
    public const string EmailHeader = "X-Test-Oidc-Email";
    public const string NameHeader = "X-Test-Oidc-Name";
    public const string RolesHeader = "X-Test-Oidc-Roles";
    public const string MfaHeader = "X-Test-Oidc-Amr";
    public const string IssuedAtHeader = "X-Test-Oidc-Iat";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue(SubjectHeader, out var subValues) ||
            string.IsNullOrWhiteSpace(subValues.FirstOrDefault()))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var sub = subValues.First()!;
        var email = Request.Headers[EmailHeader].FirstOrDefault() ?? $"{sub}@knorooms.test";
        var name = Request.Headers[NameHeader].FirstOrDefault() ?? email;
        var iat = Request.Headers[IssuedAtHeader].FirstOrDefault()
            ?? DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(CultureInfo.InvariantCulture);

        var claims = new List<Claim>
        {
            new("sub", sub),
            new("iss", "https://idp.knorooms.test/realms/knorooms"),
            new("email", email),
            new("name", name),
            new("iat", iat)
        };

        if (Request.Headers.TryGetValue(RolesHeader, out var roleHeader))
        {
            foreach (var role in roleHeader.ToString().Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                claims.Add(new Claim("roles", role));
            }
        }

        if (Request.Headers.TryGetValue(MfaHeader, out var amrHeader) &&
            !string.IsNullOrWhiteSpace(amrHeader.FirstOrDefault()))
        {
            claims.Add(new Claim("amr", amrHeader.First()!));
        }

        var identity = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}

public sealed class TestApiFactory(string appRoleConnectionString, bool enforceMfa = false)
    : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = appRoleConnectionString,
                ["Database:AutoMigrateOnStartup"] = "false",
                ["Database:SeedDevelopmentData"] = "false",
                ["Database:EnableOutboxWorker"] = "false",
                ["Tenancy:BaseDomain"] = "localhost",
                ["Tenancy:PlatformSubdomain"] = "admin",
                ["Authentication:Oidc:Authority"] = "https://idp.knorooms.test/realms/knorooms",
                ["Authentication:Oidc:Audience"] = "knorooms-api",
                ["Authentication:Oidc:RequireHttpsMetadata"] = "false",
                ["Authentication:Oidc:EnforceMfaForPrivilegedRoles"] = enforceMfa ? "true" : "false"
            });
        });

        builder.ConfigureServices(services =>
        {
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = TestOidcAuthHandler.SchemeName;
                options.DefaultChallengeScheme = TestOidcAuthHandler.SchemeName;
            })
            .AddScheme<AuthenticationSchemeOptions, TestOidcAuthHandler>(
                TestOidcAuthHandler.SchemeName,
                _ => { });
        });
    }
}
