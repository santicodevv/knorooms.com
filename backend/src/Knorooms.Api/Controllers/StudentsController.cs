using FluentValidation;
using Knorooms.Api.Common;
using Knorooms.Api.Contracts;
using Knorooms.Modules.Modules.Students.Contracts;
using Knorooms.SharedKernel.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Knorooms.Api.Controllers;

[ApiController]
[Route("api/tenant/students")]
public sealed class StudentsController(
    IStudentDirectoryService studentDirectoryService) : ControllerBase
{
    [HttpGet("overview")]
    [Authorize(Policy = PermissionCatalog.InstitutionStudentsRead)]
    public async Task<ActionResult<StudentDirectoryOverviewDto>> GetOverview(CancellationToken cancellationToken)
    {
        var overview = await studentDirectoryService.GetOverviewAsync(cancellationToken);
        return Ok(overview);
    }

    [HttpGet]
    [Authorize(Policy = PermissionCatalog.InstitutionStudentsRead)]
    public async Task<ActionResult<IReadOnlyList<StudentDto>>> ListStudents(CancellationToken cancellationToken)
    {
        var students = await studentDirectoryService.ListStudentsAsync(cancellationToken);
        return Ok(students);
    }

    [HttpPost]
    [Authorize(Policy = PermissionCatalog.InstitutionStudentsManage)]
    public async Task<ActionResult<StudentDto>> CreateStudent(
        [FromBody] CreateStudentRequest request,
        [FromServices] IValidator<CreateStudentRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return this.ToValidationProblem(validation);
        }

        var actorUserId = HttpContext.GetAuthenticatedUserId();
        var result = await studentDirectoryService.CreateStudentAsync(
            actorUserId,
            new CreateStudentCommand(
                request.StudentCode,
                request.FirstName,
                request.LastName,
                request.BirthDate,
                request.SigerdExternalId),
            cancellationToken);

        return result.IsSuccess
            ? StatusCode(StatusCodes.Status201Created, result.Value)
            : this.ToProblemResult(result.Error);
    }

    [HttpPost("{id:guid}/deactivate")]
    [Authorize(Policy = PermissionCatalog.InstitutionStudentsManage)]
    public async Task<IActionResult> DeactivateStudent(Guid id, CancellationToken cancellationToken)
    {
        var actorUserId = HttpContext.GetAuthenticatedUserId();
        var result = await studentDirectoryService.DeactivateStudentAsync(actorUserId, id, cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblemResult(result.Error);
    }

    [HttpPost("{id:guid}/activate")]
    [Authorize(Policy = PermissionCatalog.InstitutionStudentsManage)]
    public async Task<IActionResult> ActivateStudent(Guid id, CancellationToken cancellationToken)
    {
        var actorUserId = HttpContext.GetAuthenticatedUserId();
        var result = await studentDirectoryService.ActivateStudentAsync(actorUserId, id, cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblemResult(result.Error);
    }

    [HttpGet("guardians")]
    [Authorize(Policy = PermissionCatalog.InstitutionStudentsRead)]
    public async Task<ActionResult<IReadOnlyList<GuardianDto>>> ListGuardians(CancellationToken cancellationToken)
    {
        var guardians = await studentDirectoryService.ListGuardiansAsync(cancellationToken);
        return Ok(guardians);
    }

    [HttpPost("guardians")]
    [Authorize(Policy = PermissionCatalog.InstitutionStudentsManage)]
    public async Task<ActionResult<GuardianDto>> CreateGuardian(
        [FromBody] CreateGuardianRequest request,
        [FromServices] IValidator<CreateGuardianRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return this.ToValidationProblem(validation);
        }

        var actorUserId = HttpContext.GetAuthenticatedUserId();
        var result = await studentDirectoryService.CreateGuardianAsync(
            actorUserId,
            new CreateGuardianCommand(request.FullName, request.Email, request.PhoneNumber),
            cancellationToken);

        return result.IsSuccess
            ? StatusCode(StatusCodes.Status201Created, result.Value)
            : this.ToProblemResult(result.Error);
    }

    [HttpPost("{studentId:guid}/guardians")]
    [Authorize(Policy = PermissionCatalog.InstitutionStudentsManage)]
    public async Task<ActionResult<StudentGuardianSummaryDto>> LinkGuardian(
        Guid studentId,
        [FromBody] LinkStudentGuardianRequest request,
        [FromServices] IValidator<LinkStudentGuardianRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return this.ToValidationProblem(validation);
        }

        var actorUserId = HttpContext.GetAuthenticatedUserId();
        var result = await studentDirectoryService.LinkGuardianAsync(
            actorUserId,
            new LinkStudentGuardianCommand(
                studentId,
                request.GuardianId,
                request.RelationshipType,
                request.HasAcademicAccess,
                request.HasFinancialResponsibility,
                request.HasPickupAuthorization),
            cancellationToken);

        return result.IsSuccess
            ? StatusCode(StatusCodes.Status201Created, result.Value)
            : this.ToProblemResult(result.Error);
    }
}
