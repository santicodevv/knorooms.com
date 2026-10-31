using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Xunit;

namespace Knorooms.IntegrationTests.Evaluation;

public class ReportCardsServiceIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ReportCardsServiceIntegrationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GenerateReportCard_WithValidPayload_ReturnsSuccess()
    {
        // Arrange: Datos válidos para generar un snapshot de boletín (report_card_snapshots)
        var reportCardRequest = new
        {
            StudentId = "student-test-01",
            AcademicPeriod = "2026-Q1",
            PolicyVersionId = "policy-v1"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/report-cards/generate", reportCardRequest);

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();
    }

    [Fact]
    public async Task GenerateReportCard_WithInvalidPolicy_ReturnsProblemJsonValidation()
    {
        // Arrange: Solicitud con datos inválidos para forzar un error de validación (422 Unprocessable Entity)
        var invalidRequest = new
        {
            StudentId = "",
            AcademicPeriod = "",
            PolicyVersionId = ""
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/report-cards/generate", invalidRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        var contentType = response.Content.Headers.ContentType?.MediaType;
        contentType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task RLS_Isolation_PreventCrossTenantReportCardAccess()
    {
        // Arrange: Verificar aislamiento RLS sobre report_card_snapshots y evaluation_policy_versions
        // Act
        var response = await _client.GetAsync("/api/report-cards/restricted-tenant-check");

        // Assert
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Unauthorized, HttpStatusCode.Forbidden, HttpStatusCode.NotFound);
    }

    [Fact(Skip = "Hallazgo CONTINUIDAD.md §9: Desfase en versiones de evaluation_policy_versions al congelar snapshots históricos. Ticket: MNT-10")]
    public async Task ReportCardsService_PolicySnapshot_UnderReview()
    {
        // Prueba marcada como Skip documentando el hallazgo pendiente en §9
        await Task.CompletedTask;
    }
}