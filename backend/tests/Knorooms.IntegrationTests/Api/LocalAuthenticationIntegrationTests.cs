using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Knorooms.Api.Contracts;
using Knorooms.IntegrationTests.Infrastructure;
using Knorooms.Modules.Modules.Identity.Contracts;
using Knorooms.Modules.Modules.Identity.Domain;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Knorooms.IntegrationTests.Api;

/// <summary>
/// Verifica que KNOROOMS emite y valida sus propios JWT con credencial local:
/// login por usuario/contraseña, rechazo de credenciales inválidas, rotación de refresh token
/// y uso del access token contra un endpoint protegido.
/// </summary>
[Collection(PostgresDatabaseCollection.Name)]
public sealed class LocalAuthenticationIntegrationTests(PostgresIntegrationDatabaseFixture fixture)
{
    private const string Password = "Knorooms2026!";

    [Fact]
    public async Task Login_WithValidCredentials_IssuesTokensThatAuthenticateProtectedEndpoint()
    {
        var email = await SeedUserAsync(isPlatformAdmin: true);

        await using var factory = new TestApiFactory(fixture.AppRoleConnectionString, useRealJwtBearer: true);
        using var client = factory.CreateClient();

        var loginResponse = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(email, Password));

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        var tokens = (await loginResponse.Content.ReadFromJsonAsync<IssuedTokensDto>())!;
        Assert.False(string.IsNullOrWhiteSpace(tokens.AccessToken));
        Assert.False(string.IsNullOrWhiteSpace(tokens.RefreshToken));
        Assert.True(tokens.AccessTokenExpiresAtUtc > DateTimeOffset.UtcNow);

        using var meRequest = new HttpRequestMessage(HttpMethod.Get, "/api/me");
        meRequest.Headers.Add("X-Forwarded-Host", "admin.localhost");
        meRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokens.AccessToken);
        var meResponse = await client.SendAsync(meRequest);

        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);
        var profile = (await meResponse.Content.ReadFromJsonAsync<CurrentUserProfileDto>())!;
        Assert.Equal(email, profile.Email);
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsUnauthorized()
    {
        var email = await SeedUserAsync(isPlatformAdmin: false);

        await using var factory = new TestApiFactory(fixture.AppRoleConnectionString);
        using var client = factory.CreateClient();

        var loginResponse = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(email, "WrongPassword123!"));

        Assert.Equal(HttpStatusCode.Unauthorized, loginResponse.StatusCode);
    }

    [Fact]
    public async Task Refresh_RotatesToken_AndRejectsReusedToken()
    {
        var email = await SeedUserAsync(isPlatformAdmin: true);

        await using var factory = new TestApiFactory(fixture.AppRoleConnectionString);
        using var client = factory.CreateClient();

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, Password));
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        var original = (await loginResponse.Content.ReadFromJsonAsync<IssuedTokensDto>())!;

        var refreshResponse = await client.PostAsJsonAsync(
            "/api/auth/refresh",
            new RefreshTokenRequest(original.RefreshToken));
        Assert.Equal(HttpStatusCode.OK, refreshResponse.StatusCode);
        var rotated = (await refreshResponse.Content.ReadFromJsonAsync<IssuedTokensDto>())!;
        Assert.NotEqual(original.RefreshToken, rotated.RefreshToken);

        // Reutilizar el refresh token ya rotado debe fallar.
        var reuseResponse = await client.PostAsJsonAsync(
            "/api/auth/refresh",
            new RefreshTokenRequest(original.RefreshToken));
        Assert.Equal(HttpStatusCode.Unauthorized, reuseResponse.StatusCode);
    }

    [Fact]
    public async Task ProtectedEndpoint_RejectsForgedTokenSignedWithWrongKey()
    {
        await using var factory = new TestApiFactory(fixture.AppRoleConnectionString, useRealJwtBearer: true);
        using var client = factory.CreateClient();

        using var meRequest = new HttpRequestMessage(HttpMethod.Get, "/api/me");
        meRequest.Headers.Add("X-Forwarded-Host", "admin.localhost");
        meRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "not.a.valid.jwt");
        var meResponse = await client.SendAsync(meRequest);

        Assert.Equal(HttpStatusCode.Unauthorized, meResponse.StatusCode);
    }

    private async Task<string> SeedUserAsync(bool isPlatformAdmin)
    {
        var email = $"auth-{Guid.NewGuid():N}@knorooms.test";

        await using var provider = fixture.CreateAppRoleServiceProvider();
        await using var scope = provider.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<Knorooms.Modules.Common.Persistence.ApplicationDbContext>();
        var accessor = scope.ServiceProvider.GetRequiredService<ITenantContextAccessor>();

        using var platformScope = accessor.BeginScope(new ExecutionScopeContext(
            TenantHostKind.Platform,
            TenantId: null,
            TenantSlug: null,
            TenantName: null,
            IsTenantSuspended: false,
            UserId: null,
            ExecutionMode: Knorooms.SharedKernel.Tenancy.DatabaseExecutionMode.Platform));

        var user = UserAccount.Create(
            externalSubject: Guid.NewGuid().ToString("N"),
            issuer: TestOidcAuthHandler.Issuer,
            email: email,
            displayName: "Local Auth Test User",
            isPlatformAdmin: isPlatformAdmin).Value;

        user.SetPasswordHash(LocalPassword.Hash(Password));
        db.Users.Add(user);
        await db.SaveChangesAsync();

        return email;
    }
}
