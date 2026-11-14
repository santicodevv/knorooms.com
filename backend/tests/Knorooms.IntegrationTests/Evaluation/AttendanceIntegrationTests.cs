using System.Net;
using Knorooms.Api.Contracts;
using Knorooms.IntegrationTests.Infrastructure;
using Knorooms.Modules.Modules.Attendance.Contracts;

namespace Knorooms.IntegrationTests.Evaluation;

[Collection(PostgresDatabaseCollection.Name)]
public sealed class AttendanceIntegrationTests(PostgresIntegrationDatabaseFixture fixture)
{
    [Fact]
    public async Task AttendanceBatch_CreatesAndUpdatesRecords_RejectsDuplicateEnrollments_AndEnforcesRls()
    {
        await using var scenario = new EvaluationScenario(fixture);
        using var client = scenario.CreateClient();
        var first = await scenario.CreateSchoolAsync(client);
        var second = await scenario.CreateSchoolAsync(client);
        const string path = "/api/tenant/attendance/batch";

        foreach (var school in new[] { first, second })
        {
            var entry = new AttendanceEntryItemRequest(school.EnrollmentId, "Present", null);
            var batch = new RecordSectionAttendanceBatchRequest(school.SectionId, EvaluationScenario.ClassDate, [entry]);
            var created = await EvaluationScenario.PostAsync<AttendanceBatchRecordResultDto>(client, school.Director, path, batch, HttpStatusCode.OK);
            Assert.Equal(1, created.CreatedCount);
            Assert.Equal(0, created.UpdatedCount);

            var updated = await EvaluationScenario.PostAsync<AttendanceBatchRecordResultDto>(
                client, school.Director, path, batch with { Entries = [entry with { Status = "Late" }] }, HttpStatusCode.OK);
            Assert.Equal(0, updated.CreatedCount);
            Assert.Equal(1, updated.UpdatedCount);

            using var invalid = await EvaluationScenario.SendAsync(client, school.Director, HttpMethod.Post, path,
                batch with { Entries = [entry, entry] });
            await EvaluationScenario.AssertProblemAsync(invalid, HttpStatusCode.BadRequest, "Attendance.DuplicateEnrollmentInBatch");
        }

        await scenario.AssertIsolationAsync(
            "attendance_records", first, second);
    }
}
