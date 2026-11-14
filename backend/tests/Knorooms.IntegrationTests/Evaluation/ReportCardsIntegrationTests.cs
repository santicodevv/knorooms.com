using System.Net;
using System.Net.Http.Json;
using Knorooms.Api.Contracts;
using Knorooms.IntegrationTests.Infrastructure;
using Knorooms.Modules.Modules.ReportCards.Contracts;

namespace Knorooms.IntegrationTests.Evaluation;

[Collection(PostgresDatabaseCollection.Name)]
public sealed class ReportCardsIntegrationTests(PostgresIntegrationDatabaseFixture fixture)
{
    [Fact]
    public async Task ReportCards_PublishesSnapshot_RejectsPeriodWithoutGrades_AndEnforcesRls()
    {
        await using var scenario = new EvaluationScenario(fixture);
        using var client = scenario.CreateClient();
        var first = await scenario.CreateSchoolAsync(client);
        var second = await scenario.CreateSchoolAsync(client);
        const string path = "/api/tenant/report-cards/publish";

        foreach (var school in new[] { first, second })
        {
            var policy = await EvaluationScenario.CreatePolicyAsync(client, school);
            await EvaluationScenario.RecordGradeAsync(client, school, policy.Id);

            var snapshot = await EvaluationScenario.PostAsync<ReportCardSnapshotDto>(client, school.Director, path,
                new PublishReportCardRequest(school.EnrollmentId, policy.Id, "P1"));
            Assert.Equal(school.EnrollmentId, snapshot.EnrollmentId);
            Assert.Equal(1, snapshot.VersionNumber);
            Assert.Null(snapshot.SupersedesSnapshotId);

            using var invalid = await EvaluationScenario.SendAsync(client, school.Director, HttpMethod.Post, path,
                new PublishReportCardRequest(school.EnrollmentId, policy.Id, "P2"));
            await EvaluationScenario.AssertProblemAsync(invalid, HttpStatusCode.BadRequest, "ReportCard.NoGradesRecorded");
        }

        await scenario.AssertIsolationAsync(
            "report_card_snapshots", first, second);
    }

    [Fact(Skip = "Falta limitar las materias a la carga de la sección: https://welin1924-1793141597420.atlassian.net/browse/KNO-21")]
    public async Task ReportCards_ReadinessExcludesCatalogSubjectsOutsideSectionCourseLoad()
    {
        await using var scenario = new EvaluationScenario(fixture);
        using var client = scenario.CreateClient();
        var school = await scenario.CreateSchoolAsync(client);
        var policy = await EvaluationScenario.CreatePolicyAsync(client, school);
        await EvaluationScenario.RecordGradeAsync(client, school, policy.Id);
        await EvaluationScenario.PostAsync<Knorooms.Modules.Modules.Academic.Contracts.SubjectDto>(
            client, school.Director, "/api/tenant/academic/subjects", new CreateSubjectRequest("ART-EXTRA", "Arte"));

        using var response = await EvaluationScenario.SendAsync(client, school.Director, HttpMethod.Get,
            $"/api/tenant/report-cards?academicYearId={school.YearId}&sectionId={school.SectionId}&periodCode=P1");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var overview = Assert.IsType<ReportCardsOverviewDto>(await response.Content.ReadFromJsonAsync<ReportCardsOverviewDto>());
        Assert.Equal(1, Assert.Single(overview.StudentReadiness).TotalGradeSubjectsCount);
    }

    [Fact(Skip = "Falta distinguir publicación parcial y completa: https://welin1924-1793141597420.atlassian.net/browse/KNO-22")]
    public async Task ReportCards_CompletePublicationRequiresReviewedGrades()
    {
        await using var scenario = new EvaluationScenario(fixture);
        using var client = scenario.CreateClient();
        var school = await scenario.CreateSchoolAsync(client);
        var policy = await EvaluationScenario.CreatePolicyAsync(client, school);
        await EvaluationScenario.RecordGradeAsync(client, school, policy.Id);

        // Al implementar la publicación parcial, seleccionar aquí explícitamente la publicación completa.
        using var response = await EvaluationScenario.SendAsync(client, school.Director, HttpMethod.Post,
            "/api/tenant/report-cards/publish", new PublishReportCardRequest(school.EnrollmentId, policy.Id, "P1"));
        Assert.False(response.IsSuccessStatusCode);
    }

    [Fact(Skip = "Faltan las fechas del período de asistencia: https://welin1924-1793141597420.atlassian.net/browse/KNO-23")]
    public async Task ReportCards_AttendanceSnapshotExcludesDaysOutsidePeriod()
    {
        await using var scenario = new EvaluationScenario(fixture);
        using var client = scenario.CreateClient();
        var school = await scenario.CreateSchoolAsync(client);
        var policy = await EvaluationScenario.CreatePolicyAsync(client, school);
        await EvaluationScenario.RecordGradeAsync(client, school, policy.Id);

        // Al implementar KNO-49, configurar P1 para incluir septiembre y excluir febrero.
        foreach (var date in new[] { EvaluationScenario.ClassDate, new DateOnly(2027, 2, 15) })
        {
            using var attendance = await EvaluationScenario.SendAsync(client, school.Director, HttpMethod.Post,
                "/api/tenant/attendance/batch", new RecordSectionAttendanceBatchRequest(
                    school.SectionId, date, [new AttendanceEntryItemRequest(school.EnrollmentId, "Present", null)]));
            Assert.Equal(HttpStatusCode.OK, attendance.StatusCode);
        }

        var snapshot = await EvaluationScenario.PostAsync<ReportCardSnapshotDto>(client, school.Director,
            "/api/tenant/report-cards/publish", new PublishReportCardRequest(school.EnrollmentId, policy.Id, "P1"));
        using var payload = System.Text.Json.JsonDocument.Parse(snapshot.ImmutablePayloadJson);
        Assert.Equal(1, payload.RootElement.GetProperty("Attendance").GetProperty("TotalDaysRecorded").GetInt32());
    }

}
