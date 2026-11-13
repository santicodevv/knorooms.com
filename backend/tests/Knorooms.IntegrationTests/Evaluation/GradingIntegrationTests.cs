using System.Net;
using Knorooms.IntegrationTests.Infrastructure;

namespace Knorooms.IntegrationTests.Evaluation;

[Collection(PostgresDatabaseCollection.Name)]
public sealed class GradingIntegrationTests(PostgresIntegrationDatabaseFixture fixture)
{
    [Fact]
    public async Task Grading_CreatesPolicyAndGrade_RejectsDuplicatePolicy_AndEnforcesRls()
    {
        await using var scenario = new EvaluationScenario(fixture);
        using var client = scenario.CreateClient();
        var first = await scenario.CreateSchoolAsync(client);
        var second = await scenario.CreateSchoolAsync(client);

        foreach (var school in new[] { first, second })
        {
            var policy = await EvaluationScenario.CreatePolicyAsync(client, school);
            var grade = await EvaluationScenario.RecordGradeAsync(client, school, policy.Id);
            Assert.Equal(1, grade.CreatedCount);

            using var duplicate = await EvaluationScenario.SendAsync(client, school.Director, HttpMethod.Post,
                "/api/tenant/grading/policies", EvaluationScenario.Policy(school));
            await EvaluationScenario.AssertProblemAsync(duplicate, HttpStatusCode.Conflict, "EvaluationPolicy.DuplicateVersion");
        }

        await scenario.AssertIsolationAsync(
            "evaluation_policy_versions", first, second);
        await scenario.AssertIsolationAsync(
            "grade_entries", first, second);
    }

    [Fact(Skip = "Falta definir la carga académica por sección: https://welin1924-1793141597420.atlassian.net/browse/KNO-20")]
    public async Task Grading_RejectsSubjectOutsideSectionCourseLoad()
    {
        await using var scenario = new EvaluationScenario(fixture);
        using var client = scenario.CreateClient();
        var school = await scenario.CreateSchoolAsync(client);
        var policy = await EvaluationScenario.CreatePolicyAsync(client, school);

        using var response = await EvaluationScenario.SendAsync(client, school.Director, HttpMethod.Post,
            "/api/tenant/grading/entries/batch",
            new Knorooms.Api.Contracts.RecordSectionGradesBatchRequest(
                school.SectionId, school.SubjectId, policy.Id, "P1",
                [new Knorooms.Api.Contracts.StudentGradeItemRequest(school.EnrollmentId, 86m)]));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

}
