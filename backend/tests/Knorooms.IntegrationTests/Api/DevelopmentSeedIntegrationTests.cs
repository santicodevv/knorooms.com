using System.Net;
using System.Net.Http.Json;
using Knorooms.IntegrationTests.Infrastructure;
using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Entitlements.Contracts;
using Knorooms.Modules.Modules.Platform.Contracts;
using Knorooms.SharedKernel.Authorization;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace Knorooms.IntegrationTests.Api;

public sealed class DevelopmentSeedIntegrationTests : IClassFixture<PostgresIntegrationDatabaseFixture>
{
    private readonly PostgresIntegrationDatabaseFixture fixture;

    public DevelopmentSeedIntegrationTests(PostgresIntegrationDatabaseFixture fixture)
    {
        this.fixture = fixture;
    }

    [Fact]
    public async Task Seed_EnablesPilotModulesAndAssignsStaffRoles_WhenRunTwice()
    {
        await using var provider = fixture.CreateAppRoleServiceProvider();

        for (var attempt = 0; attempt < 2; attempt++)
        {
            await using var scope = provider.CreateAsyncScope();
            var services = scope.ServiceProvider;
            await DatabaseSeedAndInitializer.SeedDevelopmentSampleDataAsync(
                services.GetRequiredService<ApplicationDbContext>(),
                services.GetRequiredService<ITenantContextAccessor>(),
                services.GetRequiredService<IPlatformInstitutionService>(),
                services.GetRequiredService<IInstitutionModulesService>(),
                TestOidcAuthHandler.Issuer,
                NullLogger.Instance);
        }

        await using var factory = new TestApiFactory(fixture.AppRoleConnectionString);
        using var client = factory.CreateClient();
        foreach (var (slug, subject) in new[]
        {
            ("colegio-a", "a0000000-0000-0000-0000-000000000003"),
            ("colegio-b", "a0000000-0000-0000-0000-000000000005")
        })
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, "/api/tenant/capabilities");
            request.Headers.Add("X-Forwarded-Host", $"{slug}.localhost:3000");
            request.Headers.Add(TestOidcAuthHandler.SubjectHeader, subject);
            request.Headers.Add(TestOidcAuthHandler.EmailHeader, $"direccion@{slug}.edu.do");
            using var response = await client.SendAsync(request);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var access = Assert.IsType<EffectiveAccessDto>(await response.Content.ReadFromJsonAsync<EffectiveAccessDto>());
            Assert.Equal(ProductModuleCatalog.All.Count, access.Modules.Count);
            Assert.All(access.Modules, module => Assert.Equal(module.Code != "moodle", module.CanWrite));
        }

        await using var verification = provider.CreateAsyncScope();
        var db = verification.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var accessor = verification.ServiceProvider.GetRequiredService<ITenantContextAccessor>();
        using var platform = accessor.BeginScope(ExecutionScopeContext.Anonymous with
        {
            HostKind = TenantHostKind.Platform,
            ExecutionMode = DatabaseExecutionMode.Platform
        });
        var school = await db.Institutions.SingleAsync(x => x.Slug == "colegio-a");
        using var tenant = accessor.BeginScope(accessor.Current with
        {
            TenantId = school.Id,
            ExecutionMode = DatabaseExecutionMode.PlatformOnboarding
        });
        var assignments = await (from membership in db.TenantMemberships
                                 join user in db.Users on membership.UserId equals user.Id
                                 from assignment in membership.Roles
                                 join role in db.InstitutionRoles on assignment.RoleId equals role.Id
                                 orderby user.Email
                                 select role.Code).ToArrayAsync();
        Assert.Equal(
            [SystemRoleCatalog.AcademicCoordinator, SystemRoleCatalog.Principal, SystemRoleCatalog.Teacher, SystemRoleCatalog.Registrar],
            assignments);
    }
}
