using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using Knorooms.Api.Contracts;
using Knorooms.Api.Controllers;
using Knorooms.IntegrationTests.Infrastructure;
using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Entitlements.Contracts;
using Knorooms.Modules.Modules.Identity.Contracts;
using Knorooms.Modules.Modules.Platform.Contracts;
using Knorooms.Modules.Modules.Tenants.Contracts;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
namespace Knorooms.IntegrationTests.Api;

[Collection(PostgresDatabaseCollection.Name)]
public sealed class InstitutionManagementIntegrationTests(PostgresIntegrationDatabaseFixture fixture)
{
    [Fact]
    public async Task Directory_Provisioning_DirectModules_AndInvitations_WorkWithoutPlansAndRemainIsolated()
    {
        await using var factory = new TestApiFactory(fixture.AppRoleConnectionString);
        await using var app = factory.WithWebHostBuilder(builder => builder.ConfigureServices(services =>
        {
            services.Configure<InvitationOptions>(o => { o.SigningKey = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)); o.BaseDomain = "localhost:3000"; o.Scheme = "http"; });
            services.RemoveAll<IInvitationEmailSender>(); services.AddSingleton<IInvitationEmailSender>(new LocalSender());
        }));
        using var client = app.CreateClient(); var suffix = Guid.NewGuid().ToString("N")[..8]; var email = $"operator-{suffix}@example.test";
        var body = new ProvisionInstitutionCommand($"Colegio {suffix}", $"direct-{suffix}", "contact@example.test", "Contacto", "8095550100", "Santo Domingo", "", "America/Santo_Domingo", ["students"]);
        Assert.Equal(HttpStatusCode.BadRequest, (await Send(HttpMethod.Post, "/api/platform/institution-management", body with { EnabledModules = ["reportcards"] })).StatusCode);
        var empty = await Directory(); Assert.Equal(0, empty.Total); // El alta y su configuración se revierten juntas.
        var created = await Send(HttpMethod.Post, "/api/platform/institution-management", body); Assert.Equal(HttpStatusCode.Created, created.StatusCode); var a = (await created.Content.ReadFromJsonAsync<InstitutionDto>())!;
        Assert.Equal(HttpStatusCode.Conflict, (await Send(HttpMethod.Post, "/api/platform/institution-management", body)).StatusCode);
        var b = await Create("b");
        var modules = await GetModules(a.Id); Assert.Equal(new[] { "students" }, modules.EnabledModules);
        Assert.Equal(HttpStatusCode.BadRequest, (await Send(HttpMethod.Put, $"/api/platform/institution-management/{a.Id}/modules", new UpdateInstitutionModulesCommand(["moodle"], modules.Version))).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await Send(HttpMethod.Post, $"/api/platform/institutions/{a.Id}/administrators", new AssignInstitutionAdministratorRequest(email))).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await Send(HttpMethod.Post, "/api/tenant/students", new CreateStudentRequest("DIRECT-01", "Estudiante", "Prueba", new(2012, 1, 1)), $"{a.Slug}.localhost:3000")).StatusCode);
        var changed = await Send(HttpMethod.Put, $"/api/platform/institution-management/{a.Id}/modules", new UpdateInstitutionModulesCommand([], modules.Version)); Assert.Equal(HttpStatusCode.OK, changed.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await Send(HttpMethod.Put, $"/api/platform/institution-management/{a.Id}/modules", new UpdateInstitutionModulesCommand(["students"], modules.Version))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Send(HttpMethod.Post, "/api/tenant/students", new CreateStudentRequest("DIRECT-02", "Estudiante", "Prueba", new(2012, 1, 1)), $"{a.Slug}.localhost:3000")).StatusCode);
        var students = await Send(HttpMethod.Get, "/api/tenant/students", null, $"{a.Slug}.localhost:3000"); Assert.Equal(HttpStatusCode.OK, students.StatusCode); Assert.Contains("DIRECT-01", await students.Content.ReadAsStringAsync());
        var recipient = $"director-{suffix}@example.test"; var invitationPath = $"/api/platform/institutions/{b.Id}/invitations";
        var first = await Send(HttpMethod.Post, invitationPath, new InviteAdministratorRequest(recipient)); Assert.Equal(HttpStatusCode.Created, first.StatusCode); var invitation = (await first.Content.ReadFromJsonAsync<AdministratorInvitationDto>())!;
        var duplicate = await Send(HttpMethod.Post, invitationPath, new InviteAdministratorRequest(recipient)); Assert.Equal(invitation.Id, (await duplicate.Content.ReadFromJsonAsync<AdministratorInvitationDto>())!.Id);
        var resent = await Send(HttpMethod.Post, $"{invitationPath}/{invitation.Id}/resend"); Assert.Equal(HttpStatusCode.Created, resent.StatusCode); Assert.NotEqual(invitation.Id, (await resent.Content.ReadFromJsonAsync<AdministratorInvitationDto>())!.Id);
        Assert.Equal(HttpStatusCode.Conflict, (await Send(HttpMethod.Post, $"{invitationPath}/{invitation.Id}/resend")).StatusCode);
        var pending = await Directory("&administrator=Pending"); Assert.Single(pending.Items); Assert.Equal(b.Id, pending.Items[0].Id);
        var active = await Directory("&administrator=Active"); Assert.Contains(active.Items, x => x.Id == a.Id);
        for (var index = 0; index < 9; index++) await Create($"p{index}");
        var page1 = await Directory("&pageSize=10&page=1"); var page2 = await Directory("&pageSize=10&page=2"); Assert.Equal(11, page1.Total); Assert.Equal(10, page1.Items.Count); Assert.Single(page2.Items); Assert.DoesNotContain(page2.Items[0].Id, page1.Items.Select(x => x.Id));
        Assert.Equal(HttpStatusCode.BadRequest, (await Send(HttpMethod.Get, "/api/platform/institution-management?pageSize=999")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Send(HttpMethod.Get, "/api/platform/institution-management", null, $"{a.Slug}.localhost:3000")).StatusCode);
        var dashboardResponse = await Send(HttpMethod.Get, "/api/platform/institution-management/dashboard");
        Assert.Equal(HttpStatusCode.OK, dashboardResponse.StatusCode);
        var dashboard = (await dashboardResponse.Content.ReadFromJsonAsync<PlatformDashboardDto>())!;
        Assert.True(dashboard.Total >= 11);
        Assert.Equal(dashboard.Total, dashboard.Active + dashboard.Suspended);
        Assert.Equal(dashboard.WithoutActiveAdministrator, dashboard.WithoutAdministrator + dashboard.PendingInvitations + dashboard.ExpiredInvitations + dashboard.FailedInvitations);
        Assert.Equal(12, dashboard.Growth.Count);
        Assert.Equal(dashboard.Total, dashboard.Growth[^1].Total);
        Assert.True(dashboard.RecentInstitutions.Count <= 5);
        Assert.True(dashboard.Activity.Count <= 5);
        Assert.All(dashboard.Activity, x => Assert.True(x.Action.StartsWith("platform.", StringComparison.Ordinal) || x.Action == "institution.modules.updated"));
        Assert.DoesNotContain(dashboard.Modules, x => x.Code == "moodle");
        var noActive = await Directory("&administrator=NotActive");
        Assert.DoesNotContain(noActive.Items, x => x.AdministratorState == "Active");
        Assert.Equal(HttpStatusCode.Forbidden, (await Send(HttpMethod.Get, "/api/platform/institution-management/dashboard", null, $"{a.Slug}.localhost:3000")).StatusCode);
        await using (var scope = app.Services.CreateAsyncScope())
        {
            var accessor = scope.ServiceProvider.GetRequiredService<ITenantContextAccessor>(); var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            using var tenant = accessor.BeginScope(new(TenantHostKind.Institution, a.Id, a.Slug, a.Name, false, null, DatabaseExecutionMode.Tenant));
            Assert.All(await db.InstitutionModuleSettings.IgnoreQueryFilters().ToListAsync(), x => Assert.Equal(a.Id, x.TenantId));
            Assert.Equal(0, await db.InstitutionModuleSettings.ExecuteUpdateAsync(s => s.SetProperty(x => x.EnabledModules, new[] { "students" })));
            using (accessor.BeginScope(accessor.Current with { TenantId = null, ExecutionMode = DatabaseExecutionMode.PlatformDirectory }))
            { Assert.Empty(await db.Students.IgnoreQueryFilters().ToListAsync()); Assert.NotEmpty(await db.InstitutionModuleSettings.IgnoreQueryFilters().ToListAsync()); Assert.Equal(0, await db.InstitutionModuleSettings.IgnoreQueryFilters().ExecuteUpdateAsync(s => s.SetProperty(x => x.EnabledModules, new[] { "students" }))); }
            using (accessor.BeginScope(accessor.Current with { ExecutionMode = DatabaseExecutionMode.PlatformCommercial }))
            { var exception = await Assert.ThrowsAsync<Npgsql.PostgresException>(() => db.Database.ExecuteSqlInterpolatedAsync($"UPDATE institution_module_settings SET tenant_id={b.Id} WHERE tenant_id={a.Id}")); Assert.Equal("42501", exception.SqlState); }
        }
        async Task<InstitutionDto> Create(string key) { var response = await Send(HttpMethod.Post, "/api/platform/institution-management", body with { Slug = $"direct-{key}-{suffix}", Name = $"Colegio {key} {suffix}" }); Assert.Equal(HttpStatusCode.Created, response.StatusCode); return (await response.Content.ReadFromJsonAsync<InstitutionDto>())!; }
        async Task<InstitutionPageDto> Directory(string extra = "") { var response = await Send(HttpMethod.Get, $"/api/platform/institution-management?search={suffix}{extra}"); Assert.Equal(HttpStatusCode.OK, response.StatusCode); return (await response.Content.ReadFromJsonAsync<InstitutionPageDto>())!; }
        async Task<InstitutionModulesDto> GetModules(Guid id) { var response = await Send(HttpMethod.Get, $"/api/platform/institution-management/{id}/modules"); Assert.Equal(HttpStatusCode.OK, response.StatusCode); return (await response.Content.ReadFromJsonAsync<InstitutionModulesDto>())!; }
        Task<HttpResponseMessage> Send(HttpMethod method, string path, object? data = null, string host = "admin.localhost:3000") { var req = new HttpRequestMessage(method, path); req.Headers.Add("X-Forwarded-Host", host); req.Headers.Add(TestOidcAuthHandler.SubjectHeader, $"operator-{suffix}"); req.Headers.Add(TestOidcAuthHandler.EmailHeader, email); req.Headers.Add(TestOidcAuthHandler.RolesHeader, "PlatformAdmin"); req.Headers.Add(TestOidcAuthHandler.MfaHeader, "mfa"); if (data is not null) req.Content = JsonContent.Create(data); return client.SendAsync(req); }
    }
    private sealed class LocalSender : IInvitationEmailSender { public bool IsConfigured => true; public Task SendAsync(string email, string acceptanceUrl, CancellationToken cancellationToken = default) => Task.CompletedTask; }
}
