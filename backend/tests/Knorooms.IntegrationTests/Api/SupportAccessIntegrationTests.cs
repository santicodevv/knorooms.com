using System.Net;
using System.Net.Http.Json;
using Knorooms.Api.Contracts;
using Knorooms.IntegrationTests.Infrastructure;
using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.SupportAccess.Contracts;
using Knorooms.Modules.Modules.Tenants.Contracts;
using Knorooms.SharedKernel.Authorization;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Knorooms.IntegrationTests.Api;

[Collection(PostgresDatabaseCollection.Name)]
public sealed class SupportAccessIntegrationTests(
    PostgresIntegrationDatabaseFixture fixture)
{
    private static HttpRequestMessage CreateRequest(
        HttpMethod method,
        string path,
        string forwardedHost,
        string sub,
        string email,
        string roles = "",
        object? body = null,
        string? amr = null)
    {
        var req = new HttpRequestMessage(method, path);
        req.Headers.Add("X-Forwarded-Host", forwardedHost);
        req.Headers.Add(TestOidcAuthHandler.SubjectHeader, sub);
        req.Headers.Add(TestOidcAuthHandler.EmailHeader, email);

        if (!string.IsNullOrWhiteSpace(roles))
        {
            req.Headers.Add(TestOidcAuthHandler.RolesHeader, roles);
        }

        if (!string.IsNullOrWhiteSpace(amr))
        {
            req.Headers.Add(TestOidcAuthHandler.MfaHeader, amr);
        }

        if (body is not null)
        {
            req.Content = JsonContent.Create(body);
        }

        return req;
    }

    private sealed record SupportAccessScenario(
        TestApiFactory Factory,
        HttpClient Client,
        InstitutionDto Institution,
        string Suffix,
        string SupportSub,
        string SupportEmail,
        string DirectorSub,
        string DirectorEmail);

    private async Task<SupportAccessScenario> CreateScenarioAsync()
    {
        var factory = new TestApiFactory(fixture.AppRoleConnectionString);
        var client = factory.CreateClient();

        var suffix = Guid.NewGuid().ToString("N")[..6];
        var slug = $"colegio-alpha-{suffix}";

        var superAdminSub = $"superadmin-{suffix}";
        var supportSub = $"support-{suffix}";
        var directorSub = $"director-{suffix}";

        var adminEmail = $"admin-{suffix}@knorooms.com";
        var supportEmail = $"soporte-{suffix}@knorooms.com";
        var directorEmail = $"director@{slug}.edu.do";

        foreach (var (sub, email, roles) in new[]
        {
            (superAdminSub, adminEmail, "PlatformAdmin"),
            (supportSub, supportEmail, "PlatformSupport"),
            (directorSub, directorEmail, "")
        })
        {
            using var request = CreateRequest(
                HttpMethod.Get,
                "/api/me",
                "localhost:3000",
                sub,
                email,
                roles);

            var response = await client.SendAsync(request);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        InstitutionDto institution;

        using (var request = CreateRequest(
            HttpMethod.Post,
            "/api/platform/institutions",
            "admin.localhost:3000",
            superAdminSub,
            adminEmail,
            "PlatformAdmin",
            new CreateInstitutionRequest(
                slug,
                "Colegio Alpha RD")))
        {
            var response = await client.SendAsync(request);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);

            institution = (await response.Content
                .ReadFromJsonAsync<InstitutionDto>())!;

            await SubscriptionTestData.EnableAsync(
                factory.Services,
                institution.Id);
        }

        using (var request = CreateRequest(
            HttpMethod.Post,
            $"/api/platform/institutions/{institution.Id}/administrators",
            "admin.localhost:3000",
            superAdminSub,
            adminEmail,
            "PlatformAdmin",
            new AssignInstitutionAdministratorRequest(directorEmail)))
        {
            var response = await client.SendAsync(request);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }

        return new SupportAccessScenario(
            factory,
            client,
            institution,
            suffix,
            supportSub,
            supportEmail,
            directorSub,
            directorEmail);
    }

    [Fact]
    public async Task ApprovedGrant_AllowsSupportToAccessAuthorizedTenant()
    {
        var scenario = await CreateScenarioAsync();

        using var factory = scenario.Factory;
        using var client = scenario.Client;

        SupportAccessGrantDto grant;

        using (var request = CreateRequest(
            HttpMethod.Post,
            "/api/platform/support-access-requests",
            "admin.localhost:3000",
            scenario.SupportSub,
            scenario.SupportEmail,
            "PlatformSupport",
            new CreateSupportAccessRequest(
                scenario.Institution.Id,
                "Prueba de acceso aprobado",
                [
                    PermissionCatalog.InstitutionMembersRead
                ],
                DurationMinutes: 60)))
        {
            var response = await client.SendAsync(request);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);

            grant = (await response.Content
                .ReadFromJsonAsync<SupportAccessGrantDto>())!;

            Assert.Equal("Requested", grant.Status);
        }

        using (var request = CreateRequest(
            HttpMethod.Post,
            $"/api/tenant/support-access/{grant.Id}/approve",
            $"{scenario.Institution.Slug}.localhost:3000",
            scenario.DirectorSub,
            scenario.DirectorEmail))
        {
            var response = await client.SendAsync(request);

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }

        using (var request = CreateRequest(
            HttpMethod.Get,
            "/api/tenant/members",
            $"{scenario.Institution.Slug}.localhost:3000",
            scenario.SupportSub,
            scenario.SupportEmail,
            "PlatformSupport"))
        {
            var response = await client.SendAsync(request);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
    }

    [Fact]
    public async Task PendingGrant_DeniesSupportAccessToTenant()
    {
        var scenario = await CreateScenarioAsync();

        using var factory = scenario.Factory;
        using var client = scenario.Client;

        using (var request = CreateRequest(
            HttpMethod.Post,
            "/api/platform/support-access-requests",
            "admin.localhost:3000",
            scenario.SupportSub,
            scenario.SupportEmail,
            "PlatformSupport",
            new CreateSupportAccessRequest(
                scenario.Institution.Id,
                "Prueba de acceso pendiente",
                [
                    PermissionCatalog.InstitutionMembersRead
                ],
                DurationMinutes: 60)))
        {
            var response = await client.SendAsync(request);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);

            var grant = (await response.Content
                .ReadFromJsonAsync<SupportAccessGrantDto>())!;

            Assert.Equal("Requested", grant.Status);
        }

        using (var request = CreateRequest(
            HttpMethod.Get,
            "/api/tenant/members",
            $"{scenario.Institution.Slug}.localhost:3000",
            scenario.SupportSub,
            scenario.SupportEmail,
            "PlatformSupport"))
        {
            var response = await client.SendAsync(request);

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }
    }

    [Fact]
    public async Task RejectedGrant_DeniesSupportAccessToTenant()
    {
        var scenario = await CreateScenarioAsync();

        using var factory = scenario.Factory;
        using var client = scenario.Client;

        SupportAccessGrantDto grant;

        using (var request = CreateRequest(
            HttpMethod.Post,
            "/api/platform/support-access-requests",
            "admin.localhost:3000",
            scenario.SupportSub,
            scenario.SupportEmail,
            "PlatformSupport",
            new CreateSupportAccessRequest(
                scenario.Institution.Id,
                "Prueba de acceso rechazado",
                [
                    PermissionCatalog.InstitutionMembersRead
                ],
                DurationMinutes: 60)))
        {
            var response = await client.SendAsync(request);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);

            grant = (await response.Content
                .ReadFromJsonAsync<SupportAccessGrantDto>())!;

            Assert.Equal("Requested", grant.Status);
        }

        using (var request = CreateRequest(
            HttpMethod.Post,
            $"/api/tenant/support-access/{grant.Id}/reject",
            $"{scenario.Institution.Slug}.localhost:3000",
            scenario.DirectorSub,
            scenario.DirectorEmail))
        {
            var response = await client.SendAsync(request);

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }

        using (var request = CreateRequest(
            HttpMethod.Get,
            "/api/tenant/members",
            $"{scenario.Institution.Slug}.localhost:3000",
            scenario.SupportSub,
            scenario.SupportEmail,
            "PlatformSupport"))
        {
            var response = await client.SendAsync(request);

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }
    }

    [Fact]
    public async Task ExpiredGrant_DeniesSupportAccessToTenant()
    {
        var scenario = await CreateScenarioAsync();

        using var factory = scenario.Factory;
        using var client = scenario.Client;

        SupportAccessGrantDto expirationGrant;

        using (var request = CreateRequest(
            HttpMethod.Post,
            "/api/platform/support-access-requests",
            "admin.localhost:3000",
            scenario.SupportSub,
            scenario.SupportEmail,
            "PlatformSupport",
            new CreateSupportAccessRequest(
                scenario.Institution.Id,
                "Prueba independiente de vencimiento",
                [
                    PermissionCatalog.InstitutionMembersRead
                ],
                DurationMinutes: 60)))
        {
            var response = await client.SendAsync(request);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);

            expirationGrant = (await response.Content
                .ReadFromJsonAsync<SupportAccessGrantDto>())!;

            Assert.Equal("Requested", expirationGrant.Status);
        }

        using (var request = CreateRequest(
            HttpMethod.Post,
            $"/api/tenant/support-access/{expirationGrant.Id}/approve",
            $"{scenario.Institution.Slug}.localhost:3000",
            scenario.DirectorSub,
            scenario.DirectorEmail))
        {
            var response = await client.SendAsync(request);

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var tenantContext = scope.ServiceProvider
                .GetRequiredService<ITenantContextAccessor>();

            using var tenantScope = tenantContext.BeginScope(
                ExecutionScopeContext.Anonymous with
                {
                    HostKind = TenantHostKind.Institution,
                    TenantId = scenario.Institution.Id,
                    ExecutionMode = DatabaseExecutionMode.Tenant
                });

            var dbContext = scope.ServiceProvider
                .GetRequiredService<ApplicationDbContext>();

            var updated = await dbContext.SupportAccessGrants
                .Where(g => g.Id == expirationGrant.Id)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(
                        g => g.ExpiresAtUtc,
                        DateTimeOffset.UtcNow.AddMinutes(-1)));

            Assert.Equal(1, updated);
        }

        using (var request = CreateRequest(
            HttpMethod.Get,
            "/api/tenant/members",
            $"{scenario.Institution.Slug}.localhost:3000",
            scenario.SupportSub,
            scenario.SupportEmail,
            "PlatformSupport"))
        {
            var response = await client.SendAsync(request);

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }
    }

    [Fact]
    public async Task RevokedGrant_DeniesSupportAccessToTenant()
    {
        var scenario = await CreateScenarioAsync();

        using var factory = scenario.Factory;
        using var client = scenario.Client;

        SupportAccessGrantDto revokedGrant;

        using (var request = CreateRequest(
            HttpMethod.Post,
            "/api/platform/support-access-requests",
            "admin.localhost:3000",
            scenario.SupportSub,
            scenario.SupportEmail,
            "PlatformSupport",
            new CreateSupportAccessRequest(
                scenario.Institution.Id,
                "Prueba independiente de revocación",
                [
                    PermissionCatalog.InstitutionMembersRead
                ],
                DurationMinutes: 60)))
        {
            var response = await client.SendAsync(request);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);

            revokedGrant = (await response.Content
                .ReadFromJsonAsync<SupportAccessGrantDto>())!;

            Assert.Equal("Requested", revokedGrant.Status);
        }

        using (var request = CreateRequest(
            HttpMethod.Post,
            $"/api/tenant/support-access/{revokedGrant.Id}/approve",
            $"{scenario.Institution.Slug}.localhost:3000",
            scenario.DirectorSub,
            scenario.DirectorEmail))
        {
            var response = await client.SendAsync(request);

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }

        using (var request = CreateRequest(
            HttpMethod.Post,
            $"/api/tenant/support-access/{revokedGrant.Id}/revoke",
            $"{scenario.Institution.Slug}.localhost:3000",
            scenario.DirectorSub,
            scenario.DirectorEmail))
        {
            var response = await client.SendAsync(request);

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }

        using (var request = CreateRequest(
            HttpMethod.Get,
            "/api/tenant/members",
            $"{scenario.Institution.Slug}.localhost:3000",
            scenario.SupportSub,
            scenario.SupportEmail,
            "PlatformSupport"))
        {
            var response = await client.SendAsync(request);

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }
    }
}