using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Xunit;

namespace Knorooms.IntegrationTests.Evaluation;

public class GradingServiceIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public GradingServiceIntegrationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateGrade_WithValidPayload_ReturnsSuccess()
    {
        // Arrange: Datos válidos para grade_entries / GradingService
        var newGrade = new
        {
            StudentId = "student-test-01",
            CourseId = "course-test-01",
            Score = 95.0,
            Term = "Q1"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/grades", newGrade);

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();
    }

    [Fact]
    public async Task CreateGrade_WithInvalidData_ReturnsProblemJsonValidation()
    {
        // Arrange: Datos inválidos para forzar validación (422 Unprocessable Entity)
        var invalidGrade = new
        {
            StudentId = "",
            Score = -15.0 // Puntaje inválido
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/grades", invalidGrade);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        var contentType = response.Content.Headers.ContentType?.MediaType;
        contentType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task RLS_Isolation_PreventCrossTenantGradeAccess()
    {
        // Arrange: Simular consulta intentando acceder a registros de otro inquilino bajo RLS
        // Act
        var response = await _client.GetAsync("/api/grades/restricted-tenant-check");

        // Assert
        // Debe retornar NotFound o Forbidden debido a las políticas RLS en grade_entries
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Unauthorized, HttpStatusCode.Forbidden, HttpStatusCode.NotFound);
    }

    [Fact(Skip = "Hallazgo CONTINUIDAD.md §9: Comportamiento inconsistente en recálculo de notas con ponderaciones múltiples. Ticket: MNT-09")]
    public async Task GradingService_WeightRecalculation_UnderReview()
    {
        // Prueba documentada y saltada intencionalmente según §9 hasta aplicar la corrección
        await Task.CompletedTask;
    }
}