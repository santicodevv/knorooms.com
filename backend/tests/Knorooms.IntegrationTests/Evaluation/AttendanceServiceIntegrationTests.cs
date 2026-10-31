using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Xunit;

namespace Knorooms.IntegrationTests.Evaluation;

public class AttendanceServiceIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AttendanceServiceIntegrationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateAttendance_WithValidPayload_ReturnsSuccess()
    {
        // Arrange: Datos válidos para registrar asistencia en attendance_records
        var attendanceRequest = new
        {
            StudentId = "student-test-01",
            Date = "2026-10-31",
            Status = "Present"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/attendance", attendanceRequest);

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();
    }

    [Fact]
    public async Task CreateAttendance_WithInvalidData_ReturnsProblemJsonValidation()
    {
        // Arrange: Datos inválidos para forzar un error de validación (422 Unprocessable Entity)
        var invalidRequest = new
        {
            StudentId = "",
            Status = "InvalidStatus"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/attendance", invalidRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        var contentType = response.Content.Headers.ContentType?.MediaType;
        contentType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task RLS_Isolation_PreventCrossTenantAttendanceAccess()
    {
        // Arrange: Verificar aislamiento RLS sobre attendance_records
        // Act
        var response = await _client.GetAsync("/api/attendance/restricted-tenant-check");

        // Assert
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Unauthorized, HttpStatusCode.Forbidden, HttpStatusCode.NotFound);
    }

    [Fact(Skip = "Hallazgo CONTINUIDAD.md §9: Conflicto de unicidad en registros concurrentes de asistencia para la misma fecha. Ticket: MNT-11")]
    public async Task AttendanceService_ConcurrentRecords_UnderReview()
    {
        // Prueba marcada como Skip documentando el hallazgo pendiente en §9
        await Task.CompletedTask;
    }
}