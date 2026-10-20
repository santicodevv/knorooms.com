using FluentValidation;
using Knorooms.Api.Common;
using Knorooms.Api.Contracts;
using Knorooms.Modules.Modules.ReportCards.Contracts;
using Knorooms.SharedKernel.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Knorooms.Api.Controllers;

[ApiController]
[Route("api/tenant/report-cards")]
[Authorize]
public sealed class ReportCardsController(IReportCardsService reportCardsService) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = PermissionCatalog.InstitutionReportCardsRead)]
    [ProducesResponseType<ReportCardsOverviewDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOverview(
        [FromQuery] Guid? academicYearId,
        [FromQuery] Guid? sectionId,
        [FromQuery] string? periodCode,
        CancellationToken cancellationToken)
    {
        var overview = await reportCardsService.GetReportCardsOverviewAsync(
            academicYearId,
            sectionId,
            periodCode,
            cancellationToken);

        return Ok(overview);
    }

    [HttpPost("publish")]
    [Authorize(Policy = PermissionCatalog.InstitutionReportCardsPublish)]
    [ProducesResponseType<ReportCardSnapshotDto>(StatusCodes.Status201Created)]
    public async Task<IActionResult> PublishReportCard(
        [FromBody] PublishReportCardRequest request,
        [FromServices] IValidator<PublishReportCardRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return this.ToValidationProblem(validation);
        }

        var result = await reportCardsService.PublishReportCardAsync(
            new PublishReportCardCommand(
                request.EnrollmentId,
                request.EvaluationPolicyVersionId,
                request.PeriodCode,
                request.CorrectionReason),
            cancellationToken);

        return result.IsSuccess
            ? StatusCode(StatusCodes.Status201Created, result.Value)
            : this.ToProblemResult(result.Error);
    }
}
