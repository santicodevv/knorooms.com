using FluentValidation;
using Knorooms.Api.Common;
using Knorooms.Api.Contracts;
using Knorooms.Modules.Modules.Grading.Contracts;
using Knorooms.SharedKernel.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Knorooms.Api.Controllers;

[ApiController]
[Route("api/tenant/grading")]
[Authorize]
public sealed class GradingController(IGradingService gradingService) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = PermissionCatalog.InstitutionGradingRead)]
    [ProducesResponseType<GradingWorkspaceOverviewDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOverview(
        [FromQuery] Guid? academicYearId,
        [FromQuery] Guid? sectionId,
        [FromQuery] Guid? subjectId,
        [FromQuery] string? periodCode,
        CancellationToken cancellationToken)
    {
        var overview = await gradingService.GetGradingWorkspaceOverviewAsync(
            academicYearId,
            sectionId,
            subjectId,
            periodCode,
            cancellationToken);

        return Ok(overview);
    }

    [HttpPost("policies")]
    [Authorize(Policy = PermissionCatalog.InstitutionGradingApprove)]
    [ProducesResponseType<EvaluationPolicyVersionDto>(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreatePolicy(
        [FromBody] CreateEvaluationPolicyRequest request,
        [FromServices] IValidator<CreateEvaluationPolicyRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return this.ToValidationProblem(validation);
        }

        var result = await gradingService.CreateEvaluationPolicyAsync(
            new CreateEvaluationPolicyCommand(
                request.AcademicYearId,
                request.PolicyCode,
                request.VersionNumber,
                request.Name,
                request.MinPassingScore,
                request.EnabledPeriods ?? ["P1", "P2", "P3", "P4"],
                request.Notes,
                request.IsValidatedWithPilotSchool),
            cancellationToken);

        return result.IsSuccess
            ? StatusCode(StatusCodes.Status201Created, result.Value)
            : this.ToProblemResult(result.Error);
    }

    [HttpPost("entries/batch")]
    [Authorize(Policy = PermissionCatalog.InstitutionGradingRecord)]
    [ProducesResponseType<GradesBatchRecordResultDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> RecordBatch(
        [FromBody] RecordSectionGradesBatchRequest request,
        [FromServices] IValidator<RecordSectionGradesBatchRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return this.ToValidationProblem(validation);
        }

        var result = await gradingService.RecordSectionGradesBatchAsync(
            new RecordSectionGradesBatchCommand(
                request.SectionId,
                request.SubjectId,
                request.EvaluationPolicyVersionId,
                request.PeriodCode,
                request.Grades
                    .Select(g => new StudentGradeInput(g.EnrollmentId, g.NumericScore, g.CorrectionReason))
                    .ToList()),
            cancellationToken);

        return result.IsSuccess
            ? Ok(result.Value)
            : this.ToProblemResult(result.Error);
    }

    [HttpPost("entries/{gradeEntryId:guid}/approve")]
    [Authorize(Policy = PermissionCatalog.InstitutionGradingApprove)]
    [ProducesResponseType<GradeEntryDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> ApproveEntry(
        [FromRoute] Guid gradeEntryId,
        CancellationToken cancellationToken)
    {
        var result = await gradingService.ApproveGradeEntryAsync(gradeEntryId, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : this.ToProblemResult(result.Error);
    }
}
