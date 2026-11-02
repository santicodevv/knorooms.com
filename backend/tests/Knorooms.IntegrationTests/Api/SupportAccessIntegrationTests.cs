using System.Net;
using System.Net.Http.Json;
using Knorooms.Api.Contracts;
using Knorooms.IntegrationTests.Infrastructure;
using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Students.Domain;
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
        string SuperAdminSub,
        string AdminEmail,
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
            superAdminSub,
            adminEmail,
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

        // Antes de revocar, la concesión aprobada sí da acceso: el 403 posterior se debe a la revocación.
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

    [Fact]
    public async Task ApprovedGrantForOneTenant_DoesNotExposeAnotherTenantDataThroughRls()
    {
        var scenario = await CreateScenarioAsync();

        using var factory = scenario.Factory;
        using var client = scenario.Client;

        var beta = await CreateInstitutionAsync(
            scenario,
            $"colegio-beta-{scenario.Suffix}",
            "Colegio Beta RD");

        await CreateStudentDirectlyAsync(factory, beta.Id, $"BETA-{scenario.Suffix}");

        var grant = await RequestAndApproveGrantAsync(
            scenario,
            "Prueba de aislamiento RLS entre colegios",
            [PermissionCatalog.InstitutionStudentsManage]);

        await CreateStudentThroughSupportAsync(scenario, $"ALPHA-{scenario.Suffix}");

        // Contexto equivalente al que arma el middleware para soporte en Alpha.
        // IgnoreQueryFilters() deja fuera el filtro de EF: solo RLS de PostgreSQL puede aislar a Beta.
        await using var scope = factory.Services.CreateAsyncScope();

        var tenantContext = scope.ServiceProvider
            .GetRequiredService<ITenantContextAccessor>();

        using var tenantScope = tenantContext.BeginScope(new ExecutionScopeContext(
            TenantHostKind.Institution,
            scenario.Institution.Id,
            scenario.Institution.Slug,
            "Colegio Alpha RD",
            IsTenantSuspended: false,
            grant.RequestedByUserId,
            DatabaseExecutionMode.Tenant,
            TenantAccessType.Support,
            SupportAccessGrantId: grant.Id,
            SupportAccessExpiresAtUtc: grant.ExpiresAt));

        var dbContext = scope.ServiceProvider
            .GetRequiredService<ApplicationDbContext>();

        var betaStudents = await dbContext.Students
            .IgnoreQueryFilters()
            .CountAsync(s => s.TenantId == beta.Id);

        Assert.Equal(0, betaStudents);

        var visibleTenantIds = await dbContext.Students
            .IgnoreQueryFilters()
            .Select(s => s.TenantId)
            .Distinct()
            .ToListAsync();

        Assert.Equal([scenario.Institution.Id], visibleTenantIds);

        // ExecuteUpdateAsync va directo a SQL sin pasar por la validación del ChangeTracker:
        // RLS tampoco deja modificar filas de Beta desde el contexto de Alpha.
        var updatedBetaStudents = await dbContext.Students
            .IgnoreQueryFilters()
            .Where(s => s.TenantId == beta.Id)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(s => s.FirstName, "Intruso"));

        Assert.Equal(0, updatedBetaStudents);
    }

    [Fact]
    public async Task GrantUsage_IsAuditedWithGrantIdAndWithoutSecrets()
    {
        var scenario = await CreateScenarioAsync();

        using var factory = scenario.Factory;
        using var client = scenario.Client;

        var grant = await RequestAndApproveGrantAsync(
            scenario,
            "Prueba de auditoría del uso de la concesión",
            [PermissionCatalog.InstitutionStudentsManage]);

        // Valor centinela: si la auditoría copiara cabeceras de la petición, aparecería en la bitácora.
        const string cookieCanary = "cookie-canary-7f3a";

        await CreateStudentThroughSupportAsync(
            scenario,
            $"AUD-{scenario.Suffix}",
            request => request.Headers.Add("Cookie", $"knorooms_session={cookieCanary}"));

        await using var scope = factory.Services.CreateAsyncScope();

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

        var entries = await dbContext.AuditLogs
            .Where(e => e.SupportAccessGrantId == grant.Id)
            .ToListAsync();

        var studentCreated = Assert.Single(entries, e => e.Action == "student.created");
        Assert.Equal(nameof(TenantAccessType.Support), studentCreated.ActorAccessType);
        Assert.Equal(grant.RequestedByUserId, studentCreated.ActorUserId);
        Assert.Equal(scenario.Institution.Id, studentCreated.TenantId);

        string[] forbiddenFragments =
        [
            cookieCanary,
            "knorooms_session",
            "Bearer",
            "password",
            "refresh_token",
            "access_token",
            "Cookie",
            "Authorization"
        ];

        Assert.All(entries, entry =>
        {
            var persisted = string.Join(
                '\n',
                entry.Summary,
                entry.MetadataJson,
                entry.ResourceId,
                entry.CorrelationId);

            foreach (var fragment in forbiddenFragments)
            {
                Assert.DoesNotContain(fragment, persisted, StringComparison.OrdinalIgnoreCase);
            }
        });
    }

    private static async Task<InstitutionDto> CreateInstitutionAsync(
        SupportAccessScenario scenario,
        string slug,
        string name)
    {
        using var request = CreateRequest(
            HttpMethod.Post,
            "/api/platform/institutions",
            "admin.localhost:3000",
            scenario.SuperAdminSub,
            scenario.AdminEmail,
            "PlatformAdmin",
            new CreateInstitutionRequest(slug, name));

        var response = await scenario.Client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var institution = (await response.Content
            .ReadFromJsonAsync<InstitutionDto>())!;

        await SubscriptionTestData.EnableAsync(
            scenario.Factory.Services,
            institution.Id);

        return institution;
    }

    private static async Task CreateStudentDirectlyAsync(
        TestApiFactory factory,
        Guid tenantId,
        string studentCode)
    {
        await using var scope = factory.Services.CreateAsyncScope();

        var tenantContext = scope.ServiceProvider
            .GetRequiredService<ITenantContextAccessor>();

        using var tenantScope = tenantContext.BeginScope(
            ExecutionScopeContext.Anonymous with
            {
                HostKind = TenantHostKind.Institution,
                TenantId = tenantId,
                ExecutionMode = DatabaseExecutionMode.Tenant
            });

        var dbContext = scope.ServiceProvider
            .GetRequiredService<ApplicationDbContext>();

        dbContext.Students.Add(StudentRecord.Create(
            tenantId,
            studentCode,
            "María",
            "Gómez",
            new DateOnly(2013, 9, 22)).Value);

        await dbContext.SaveChangesAsync();
    }

    private static async Task<SupportAccessGrantDto> RequestAndApproveGrantAsync(
        SupportAccessScenario scenario,
        string reason,
        IReadOnlyList<string> permissions)
    {
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
                reason,
                [.. permissions],
                DurationMinutes: 60)))
        {
            var response = await scenario.Client.SendAsync(request);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);

            grant = (await response.Content
                .ReadFromJsonAsync<SupportAccessGrantDto>())!;
        }

        using (var request = CreateRequest(
            HttpMethod.Post,
            $"/api/tenant/support-access/{grant.Id}/approve",
            $"{scenario.Institution.Slug}.localhost:3000",
            scenario.DirectorSub,
            scenario.DirectorEmail))
        {
            var response = await scenario.Client.SendAsync(request);

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }

        // Releer la concesión aprobada para obtener su vencimiento real.
        await using var scope = scenario.Factory.Services.CreateAsyncScope();

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

        var expiresAt = await dbContext.SupportAccessGrants
            .Where(g => g.Id == grant.Id)
            .Select(g => g.ExpiresAtUtc)
            .SingleAsync();

        return grant with { Status = "Approved", ExpiresAt = expiresAt };
    }

    private static async Task CreateStudentThroughSupportAsync(
        SupportAccessScenario scenario,
        string studentCode,
        Action<HttpRequestMessage>? configure = null)
    {
        using var request = CreateRequest(
            HttpMethod.Post,
            "/api/tenant/students",
            $"{scenario.Institution.Slug}.localhost:3000",
            scenario.SupportSub,
            scenario.SupportEmail,
            "PlatformSupport",
            body: new CreateStudentRequest(
                studentCode,
                "Estudiante",
                "Prueba Soporte",
                new DateOnly(2015, 1, 1)));

        configure?.Invoke(request);

        var response = await scenario.Client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }
}
