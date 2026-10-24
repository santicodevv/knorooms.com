using System.Net;
using System.Net.Http.Json;
using Knorooms.Api.Contracts;
using Knorooms.Modules.Modules.Academic.Domain;
using Knorooms.IntegrationTests.Infrastructure;
using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Subscriptions.Contracts;
using Knorooms.Modules.Modules.Entitlements.Contracts;
using Knorooms.Modules.Modules.Tenants.Contracts;
using Knorooms.Modules.Modules.Students.Domain;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
namespace Knorooms.IntegrationTests.Api;

[Collection(PostgresDatabaseCollection.Name)]
public sealed class SubscriptionsIntegrationTests(PostgresIntegrationDatabaseFixture fixture)
{
    [Fact]
    public async Task CommercialRules_AreEnforcedByApiAndPersistence_WithTenantIsolationAndConcurrentLimits()
    {
        await using var factory = new TestApiFactory(fixture.AppRoleConnectionString);
        using var client = factory.CreateClient();
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var a = await Create("a"); var b = await Create("b");
        await Send(HttpMethod.Get, "/api/me", null, "localhost:3000", false);
        foreach (var institution in new[] { a, b })
            Assert.Equal(HttpStatusCode.Created, (await Send(HttpMethod.Post, $"/api/platform/institutions/{institution.Id}/administrators", new AssignInstitutionAdministratorRequest($"director-{suffix}@example.test"))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Student(a, "NO-PLAN")).StatusCode);
        var command = new CreatePlanCommand($"PILOT-{suffix}", "Piloto", "Condiciones de prueba", 1, 100, "DOP", "Monthly", 1, 1,
            ["students", "academic", "enrollments", "attendance", "grading", "reportcards"]);
        var created = await Send(HttpMethod.Post, "/api/platform/plans", command);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var plan = (await created.Content.ReadFromJsonAsync<PlanVersionDto>())!;
        Assert.Equal(HttpStatusCode.Conflict, (await Send(HttpMethod.Post, "/api/platform/plans", command)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Send(HttpMethod.Post, "/api/platform/plans", command with { Revision = 2 }, $"{a.Slug}.localhost:3000", false)).StatusCode);
        var assignment = new AssignSubscriptionCommand(plan.Id, DateTimeOffset.UtcNow.AddDays(-1), DateTimeOffset.UtcNow.AddDays(1), "Active", "Alta de prueba", [], null);
        var current = await Assign(assignment);
        Assert.Equal(HttpStatusCode.Conflict, (await Send(HttpMethod.Put, $"/api/platform/institutions/{a.Id}/subscription", assignment)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Student(b, "NO-PLAN-B")).StatusCode);
        var parallel = await Task.WhenAll(Student(a, "ST-01"), Student(a, "ST-02"));
        Assert.Single(parallel, x => x.StatusCode == HttpStatusCode.Created);
        Assert.Single(parallel, x => x.StatusCode == HttpStatusCode.Forbidden);
        var oldPlan = await Send(HttpMethod.Post, "/api/platform/plans", command with { Revision = 2, MaxActiveStudents = 100 });
        Assert.Equal(HttpStatusCode.Created, oldPlan.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Student(a, "ST-03")).StatusCode); // Nueva versión no cambia contratos anteriores.
        current = await Assign(assignment with { Version = current.Subscription!.Version, Overrides = [new("academic", false)] });
        Assert.False(current.Access.Modules.Single(x => x.Code == "grading").CanWrite);
        current = await Assign(assignment with { Version = current.Subscription!.Version, Status = "Suspended" });
        Assert.All(current.Access.Modules, x => Assert.False(x.CanWrite));
        Assert.Equal(HttpStatusCode.Forbidden, (await Student(a, "SUSPENDED")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await Send(HttpMethod.Get, "/api/tenant/students", null, $"{a.Slug}.localhost:3000", false)).StatusCode);
        current = await Assign(assignment with { Version = current.Subscription!.Version, EndsAtUtc = DateTimeOffset.UtcNow.AddMinutes(-1) });
        Assert.Equal("Expired", current.Access.Status);
        Assert.Equal(HttpStatusCode.Forbidden, (await Student(a, "EXPIRED")).StatusCode);
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var accessor = scope.ServiceProvider.GetRequiredService<ITenantContextAccessor>();
            using var tenant = accessor.BeginScope(new(TenantHostKind.Institution, a.Id, a.Slug, a.Name, false, null, DatabaseExecutionMode.Tenant));
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            Assert.Single(await db.Students.ToListAsync());
            Assert.All(await db.InstitutionSubscriptions.IgnoreQueryFilters().ToListAsync(), x => Assert.Equal(a.Id, x.TenantId));
            Assert.Equal(0, await db.InstitutionSubscriptions.Where(x => x.TenantId == a.Id).ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, "Active")));
            db.Students.Add(StudentRecord.Create(a.Id, "JOB", "Prueba", "Trabajo", new(2012, 1, 1)).Value);
            await Assert.ThrowsAsync<CommercialAccessException>(() => db.SaveChangesAsync(false)); // Trabajo sin HTTP también bloqueado.
            db.ChangeTracker.Clear();
            using (accessor.BeginScope(accessor.Current with { TenantId = b.Id })) Assert.Empty(await db.InstitutionSubscriptions.IgnoreQueryFilters().ToListAsync());
            using (accessor.BeginScope(accessor.Current with { TenantId = null, ExecutionMode = DatabaseExecutionMode.Platform }))
            { Assert.Empty(await db.InstitutionSubscriptions.IgnoreQueryFilters().ToListAsync()); Assert.Empty(await db.Students.IgnoreQueryFilters().ToListAsync()); }
            using (accessor.BeginScope(accessor.Current with { ExecutionMode = DatabaseExecutionMode.PlatformCommercial }))
            {
                Assert.Empty(await db.Students.IgnoreQueryFilters().ToListAsync());
                var error = await Assert.ThrowsAsync<Npgsql.PostgresException>(() => db.Database.ExecuteSqlInterpolatedAsync($"UPDATE institution_subscriptions SET tenant_id = {b.Id} WHERE tenant_id = {a.Id}"));
                Assert.Equal("42501", error.SqlState);
            }
            Assert.NotEmpty(await db.AuditLogs.Where(x => x.Action == "subscription.assigned").ToListAsync());
        }
        current = await Assign(assignment with { Version = current.Subscription!.Version });
        Assert.True(current.Access.Modules.Single(x => x.Code == "students").CanWrite);
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var accessor = scope.ServiceProvider.GetRequiredService<ITenantContextAccessor>();
            using var tenant = accessor.BeginScope(new(TenantHostKind.Institution, a.Id, a.Slug, a.Name, false, null, DatabaseExecutionMode.Tenant));
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var year = AcademicYear.Create(a.Id, "2026", "Año escolar", new(2026, 1, 1), new(2026, 12, 31)).Value;
            var grade = GradeLevel.Create(a.Id, EducationalStage.Primary, 1, "P1", "Primero").Value;
            db.AcademicYears.Add(year); db.GradeLevels.Add(grade);
            db.SchoolSections.Add(SchoolSection.Create(a.Id, year.Id, grade.Id, "A", SchoolShift.Morning, 30).Value);
            await db.SaveChangesAsync();
            db.SchoolSections.Add(SchoolSection.Create(a.Id, year.Id, grade.Id, "B", SchoolShift.Morning, 30).Value);
            var denied = await Assert.ThrowsAsync<CommercialAccessException>(() => db.SaveChangesAsync());
            Assert.Equal("Entitlement.SectionLimit", denied.Code);
            db.ChangeTracker.Clear();
            Assert.Single(await db.SchoolSections.ToListAsync());
        }


        async Task<InstitutionDto> Create(string key)
        { var response = await Send(HttpMethod.Post, "/api/platform/institutions", new CreateInstitutionRequest($"commercial-{key}-{suffix}", "Colegio comercial")); Assert.Equal(HttpStatusCode.Created, response.StatusCode); return (await response.Content.ReadFromJsonAsync<InstitutionDto>())!; }
        async Task<SubscriptionOverviewDto> Assign(AssignSubscriptionCommand value)
        { var response = await Send(HttpMethod.Put, $"/api/platform/institutions/{a.Id}/subscription", value); Assert.Equal(HttpStatusCode.OK, response.StatusCode); return (await response.Content.ReadFromJsonAsync<SubscriptionOverviewDto>())!; }
        Task<HttpResponseMessage> Student(InstitutionDto school, string code) => Send(HttpMethod.Post, "/api/tenant/students", new CreateStudentRequest(code, "Estudiante", "Prueba", new(2012, 1, 1)), $"{school.Slug}.localhost:3000", false);
        Task<HttpResponseMessage> Send(HttpMethod method, string path, object? body = null, string host = "admin.localhost:3000", bool admin = true)
        {
            var req = new HttpRequestMessage(method, path); req.Headers.Add("X-Forwarded-Host", host);
            req.Headers.Add(TestOidcAuthHandler.SubjectHeader, $"{(admin ? "operator" : "director")}-{suffix}");
            req.Headers.Add(TestOidcAuthHandler.EmailHeader, $"{(admin ? "operator" : "director")}-{suffix}@example.test");
            req.Headers.Add(TestOidcAuthHandler.MfaHeader, "mfa"); if (admin) req.Headers.Add(TestOidcAuthHandler.RolesHeader, "PlatformAdmin");
            if (body is not null) req.Content = JsonContent.Create(body); return client.SendAsync(req);
        }
    }
}
