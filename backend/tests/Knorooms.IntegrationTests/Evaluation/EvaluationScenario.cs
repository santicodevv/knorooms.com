using System.Net;
using System.Net.Http.Json;
using Knorooms.Api.Contracts;
using Knorooms.IntegrationTests.Infrastructure;
using Knorooms.Modules.Modules.Academic.Contracts;
using Knorooms.Modules.Modules.Enrollments.Contracts;
using Knorooms.Modules.Modules.Grading.Contracts;
using Knorooms.Modules.Modules.Platform.Contracts;
using Knorooms.Modules.Modules.Students.Contracts;
using Knorooms.Modules.Modules.Tenants.Contracts;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace Knorooms.IntegrationTests.Evaluation;

internal sealed class EvaluationScenario(PostgresIntegrationDatabaseFixture fixture) : IAsyncDisposable
{
    private readonly TestApiFactory factory = new(fixture.AppRoleConnectionString);
    public static readonly DateOnly ClassDate = new(2026, 9, 15);

    public async Task<School> CreateSchoolAsync(HttpClient client)
    {
        var slug = $"colegio-eval-{Guid.NewGuid():N}";
        var admin = new Actor($"admin-{slug}", $"admin@{slug}.edu.do", "admin.localhost:3000", "PlatformAdmin");
        var director = new Actor($"director-{slug}", $"director@{slug}.edu.do", $"{slug}.localhost:3000");

        foreach (var actor in new[] { admin, director })
        {
            using var me = await SendAsync(client, actor with { Host = "localhost:3000" }, HttpMethod.Get, "/api/me");
            Assert.Equal(HttpStatusCode.OK, me.StatusCode);
        }

        var institution = await PostAsync<InstitutionDto>(client, admin, "/api/platform/institutions",
            new CreateInstitutionRequest(slug, "Colegio de pruebas"));
        await SubscriptionTestData.EnableAsync(factory.Services, institution.Id);
        using var membership = await SendAsync(client, admin, HttpMethod.Post, $"/api/platform/institutions/{institution.Id}/administrators",
            new AssignInstitutionAdministratorRequest(director.Email));
        Assert.Equal(HttpStatusCode.Created, membership.StatusCode);

        var year = await PostAsync<AcademicYearDto>(client, director, "/api/tenant/academic/years",
            new CreateAcademicYearRequest("2026-2027", "Año Escolar 2026-2027", new DateOnly(2026, 8, 24), new DateOnly(2027, 6, 25)));
        var grade = await PostAsync<GradeLevelDto>(client, director, "/api/tenant/academic/grade-levels",
            new CreateGradeLevelRequest("Secondary", 11, "S5", "5.º de Secundaria"));
        var section = await PostAsync<SchoolSectionDto>(client, director, "/api/tenant/academic/sections",
            new CreateSchoolSectionRequest(year.Id, grade.Id, "A", "Morning", 28));
        var subject = await PostAsync<SubjectDto>(client, director, "/api/tenant/academic/subjects",
            new CreateSubjectRequest("MAT-S5", "Matemáticas"));
        var student = await PostAsync<StudentDto>(client, director, "/api/tenant/students",
            new CreateStudentRequest("EST-501", "Valeria", "Peralta", new DateOnly(2010, 4, 18), "SIGERD-501"));
        var enrollment = await PostAsync<StudentEnrollmentDto>(client, director, "/api/tenant/enrollments",
            new EnrollStudentRequest(student.Id, section.Id));

        return new School(institution.Id, director, year.Id, section.Id, subject.Id, enrollment.Id);
    }

    public HttpClient CreateClient() => factory.CreateClient();

    public static CreateEvaluationPolicyRequest Policy(School school) =>
        new(school.YearId, "SECUNDARIA", 1, "Política de pruebas", 70m, ["P1", "P2"], "Evaluación por períodos parciales", true);

    public static Task<EvaluationPolicyVersionDto> CreatePolicyAsync(HttpClient client, School school) =>
        PostAsync<EvaluationPolicyVersionDto>(client, school.Director, "/api/tenant/grading/policies", Policy(school));

    public static Task<GradesBatchRecordResultDto> RecordGradeAsync(HttpClient client, School school, Guid policyId) =>
        PostAsync<GradesBatchRecordResultDto>(client, school.Director, "/api/tenant/grading/entries/batch",
            new RecordSectionGradesBatchRequest(school.SectionId, school.SubjectId, policyId, "P1",
                [new StudentGradeItemRequest(school.EnrollmentId, 86m)]), HttpStatusCode.OK);

    public static async Task<T> PostAsync<T>(HttpClient client, Actor actor, string path, object body,
        HttpStatusCode status = HttpStatusCode.Created)
    {
        using var response = await SendAsync(client, actor, HttpMethod.Post, path, body);
        Assert.Equal(status, response.StatusCode);
        return Assert.IsType<T>(await response.Content.ReadFromJsonAsync<T>());
    }

    public static async Task<HttpResponseMessage> SendAsync(HttpClient client, Actor actor, HttpMethod method, string path, object? body = null)
    {
        using var request = new HttpRequestMessage(method, path);
        request.Headers.Add("X-Forwarded-Host", actor.Host);
        request.Headers.Add(TestOidcAuthHandler.SubjectHeader, actor.Subject);
        request.Headers.Add(TestOidcAuthHandler.EmailHeader, actor.Email);
        if (actor.Roles is not null)
        {
            request.Headers.Add(TestOidcAuthHandler.RolesHeader, actor.Roles);
        }

        if (body is not null)
        {
            request.Content = JsonContent.Create(body);
        }

        return await client.SendAsync(request);
    }

    public static async Task AssertProblemAsync(HttpResponseMessage response, HttpStatusCode status, string title)
    {
        Assert.Equal(status, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var problem = Assert.IsType<ProblemDetails>(await response.Content.ReadFromJsonAsync<ProblemDetails>());
        Assert.Equal((int)status, problem.Status);
        Assert.Equal(title, problem.Title);
    }

    public async Task AssertIsolationAsync(string table, School first, School second)
    {
        await using var connection = new NpgsqlConnection(fixture.AppRoleConnectionString);
        await connection.OpenAsync();
        await AssertVisibleTenantsAsync(first.TenantId, "tenant", [first.TenantId]);
        await AssertVisibleTenantsAsync(second.TenantId, "tenant", [second.TenantId]);
        await AssertVisibleTenantsAsync(null, "platform", []);

        async Task AssertVisibleTenantsAsync(Guid? tenantId, string mode, Guid[] expected)
        {
            await using var tx = await connection.BeginTransactionAsync();
            await using var context = new NpgsqlCommand("""
                SELECT set_config('app.current_tenant_id', @tenant, true),
                       set_config('app.execution_mode', @mode, true);
                """, connection, tx);
            context.Parameters.AddWithValue("tenant", tenantId?.ToString() ?? "");
            context.Parameters.AddWithValue("mode", mode);
            await context.ExecuteNonQueryAsync();

            await using var query = new NpgsqlCommand($"SELECT tenant_id FROM {table} WHERE tenant_id IN (@first, @second)", connection, tx);
            query.Parameters.AddWithValue("first", first.TenantId);
            query.Parameters.AddWithValue("second", second.TenantId);
            var tenants = new List<Guid>();
            await using (var reader = await query.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    tenants.Add(reader.GetGuid(0));
                }
            }

            Assert.Equal(expected, tenants);
            if (tenantId == first.TenantId)
            {
                await using var update = new NpgsqlCommand(
                    $"UPDATE {table} SET tenant_id = @second WHERE tenant_id = @first", connection, tx);
                update.Parameters.AddWithValue("first", first.TenantId);
                update.Parameters.AddWithValue("second", second.TenantId);
                var denied = await Assert.ThrowsAsync<PostgresException>(async () => await update.ExecuteNonQueryAsync());
                Assert.Equal(PostgresErrorCodes.InsufficientPrivilege, denied.SqlState);
            }

            await tx.RollbackAsync();
        }
    }

    public ValueTask DisposeAsync() => factory.DisposeAsync();

    internal sealed record Actor(string Subject, string Email, string Host, string? Roles = null);
    internal sealed record School(Guid TenantId, Actor Director, Guid YearId, Guid SectionId, Guid SubjectId, Guid EnrollmentId);
}
