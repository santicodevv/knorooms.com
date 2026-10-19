using FluentValidation;
using Knorooms.Api.Common;
using Knorooms.Api.Contracts;
using Knorooms.Modules.Modules.Enrollments.Contracts;
using Knorooms.SharedKernel.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Knorooms.Api.Controllers;

[ApiController]
[Route("api/tenant/enrollments")]
public sealed class EnrollmentsController(
    IStudentEnrollmentService studentEnrollmentService) : ControllerBase
{
    [HttpGet("overview")]
    [Authorize(Policy = PermissionCatalog.InstitutionEnrollmentsRead)]
    public async Task<ActionResult<EnrollmentsOverviewDto>> GetOverview(
        [FromQuery] Guid? academicYearId,
        [FromQuery] Guid? sectionId,
        CancellationToken cancellationToken)
    {
        var overview = await studentEnrollmentService.GetOverviewAsync(
            academicYearId,
            sectionId,
            cancellationToken);
        return Ok(overview);
    }

    [HttpGet]
    [Authorize(Policy = PermissionCatalog.InstitutionEnrollmentsRead)]
    public async Task<ActionResult<IReadOnlyList<StudentEnrollmentDto>>> ListEnrollments(
        [FromQuery] Guid? academicYearId,
        [FromQuery] Guid? sectionId,
        CancellationToken cancellationToken)
    {
        var items = await studentEnrollmentService.ListEnrollmentsAsync(
            academicYearId,
            sectionId,
            cancellationToken);
        return Ok(items);
    }

    [HttpPost]
    [Authorize(Policy = PermissionCatalog.InstitutionEnrollmentsManage)]
    public async Task<ActionResult<StudentEnrollmentDto>> EnrollStudent(
        [FromBody] EnrollStudentRequest request,
        [FromServices] IValidator<EnrollStudentRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return this.ToValidationProblem(validation);
        }

        var actorUserId = HttpContext.GetAuthenticatedUserId();
        var result = await studentEnrollmentService.EnrollStudentAsync(
            actorUserId,
            new EnrollStudentCommand(request.StudentId, request.SectionId),
            cancellationToken);

        return result.IsSuccess
            ? StatusCode(StatusCodes.Status201Created, result.Value)
            : this.ToProblemResult(result.Error);
    }

    [HttpPost("{id:guid}/transfer-section")]
    [Authorize(Policy = PermissionCatalog.InstitutionEnrollmentsManage)]
    public async Task<ActionResult<StudentEnrollmentDto>> TransferSection(
        Guid id,
        [FromBody] TransferStudentSectionRequest request,
        [FromServices] IValidator<TransferStudentSectionRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return this.ToValidationProblem(validation);
        }

        var actorUserId = HttpContext.GetAuthenticatedUserId();
        var result = await studentEnrollmentService.TransferSectionAsync(
            actorUserId,
            new TransferStudentSectionCommand(id, request.TargetSectionId),
            cancellationToken);

        return result.IsSuccess ? Ok(result.Value) : this.ToProblemResult(result.Error);
    }

    [HttpPost("{id:guid}/withdraw")]
    [Authorize(Policy = PermissionCatalog.InstitutionEnrollmentsManage)]
    public async Task<IActionResult> WithdrawEnrollment(Guid id, CancellationToken cancellationToken)
    {
        var actorUserId = HttpContext.GetAuthenticatedUserId();
        var result = await studentEnrollmentService.WithdrawEnrollmentAsync(actorUserId, id, cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblemResult(result.Error);
    }
}
