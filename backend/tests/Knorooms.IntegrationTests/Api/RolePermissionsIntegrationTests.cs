using System.Net;
using System.Net.Http.Json;
using Knorooms.IntegrationTests.Evaluation;
using Knorooms.IntegrationTests.Infrastructure;
using Knorooms.Modules.Modules.Authorization.Contracts;
using Knorooms.SharedKernel.Authorization;

namespace Knorooms.IntegrationTests.Api;

[Collection(PostgresDatabaseCollection.Name)]
public sealed class RolePermissionsIntegrationTests(PostgresIntegrationDatabaseFixture fixture)
{
    [Fact]
    public async Task Administrator_CanReplaceSystemRolePermissions_WithinOwnSchool()
    {
        await using var scenario = new EvaluationScenario(fixture);
        using var client = scenario.CreateClient();
        var school = await scenario.CreateSchoolAsync(client);
        var otherSchool = await scenario.CreateSchoolAsync(client);

        var roles = await ListRolesAsync(school.Director);
        var registrar = Assert.Single(roles, role => role.Code == SystemRoleCatalog.Registrar);
        Assert.Contains(PermissionCatalog.InstitutionStudentsManage, registrar.Permissions);
        Assert.Contains(PermissionCatalog.InstitutionStudentsDeactivate, registrar.Permissions);
        Assert.DoesNotContain(PermissionCatalog.InstitutionStudentsMedicalRead, registrar.Permissions);

        var next = registrar.Permissions.Where(code => code != PermissionCatalog.InstitutionStudentsDeactivate)
            .Append(PermissionCatalog.InstitutionReportsRead).ToArray();
        var path = $"/api/tenant/roles/{registrar.Id}/permissions";
        using var saved = await EvaluationScenario.SendAsync(client, school.Director, HttpMethod.Put, path,
            new UpdateRolePermissionsRequest(next));
        Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);

        using var foreign = await EvaluationScenario.SendAsync(client, otherSchool.Director, HttpMethod.Put, path,
            new UpdateRolePermissionsRequest(next));
        Assert.Equal(HttpStatusCode.NotFound, foreign.StatusCode);

        using var global = await EvaluationScenario.SendAsync(client, school.Director, HttpMethod.Put, path,
            new UpdateRolePermissionsRequest([PermissionCatalog.PlatformInstitutionsManage]));
        Assert.Equal(HttpStatusCode.BadRequest, global.StatusCode);

        var updated = Assert.Single(await ListRolesAsync(school.Director), role => role.Id == registrar.Id);
        Assert.Equal(next.Order(StringComparer.Ordinal), updated.Permissions);

        async Task<RoleDto[]> ListRolesAsync(EvaluationScenario.Actor actor)
        {
            using var response = await EvaluationScenario.SendAsync(client, actor, HttpMethod.Get, "/api/tenant/roles");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            return Assert.IsType<RoleDto[]>(await response.Content.ReadFromJsonAsync<RoleDto[]>());
        }
    }
}
