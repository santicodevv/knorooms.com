using FluentValidation;
using Knorooms.Api.Common;
using Knorooms.Api.Contracts;
using Knorooms.Modules.Modules.Academic.Contracts;
using Knorooms.SharedKernel.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Knorooms.Api.Controllers;

[ApiController]
[Route("api/tenant/academic")]
public sealed class AcademicController(
    IAcademicStructureService academicStructureService) : ControllerBase
{
    [HttpGet("overview")]
    [Authorize(Policy = PermissionCatalog.InstitutionAcademicRead)]
    public async Task<ActionResult<AcademicStructureOverviewDto>> GetOverview(CancellationToken cancellationToken)
    {
        var overview = await academicStructureService.GetOverviewAsync(cancellationToken);
        return Ok(overview);
    }

    [HttpGet("years")]
    [Authorize(Policy = PermissionCatalog.InstitutionAcademicRead)]
    public async Task<ActionResult<IReadOnlyList<AcademicYearDto>>> ListYears(CancellationToken cancellationToken)
    {
        var years = await academicStructureService.ListAcademicYearsAsync(cancellationToken);
        return Ok(years);
    }

    [HttpPost("years")]
    [Authorize(Policy = PermissionCatalog.InstitutionAcademicManage)]
    public async Task<ActionResult<AcademicYearDto>> CreateYear(
        [FromBody] CreateAcademicYearRequest request,
        [FromServices] IValidator<CreateAcademicYearRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return this.ToValidationProblem(validation);
        }

        var actorUserId = HttpContext.GetAuthenticatedUserId();
        var result = await academicStructureService.CreateAcademicYearAsync(
            actorUserId,
            new CreateAcademicYearCommand(request.Code, request.Name, request.StartDate, request.EndDate),
            cancellationToken);

        return result.IsSuccess
            ? StatusCode(StatusCodes.Status201Created, result.Value)
            : this.ToProblemResult(result.Error);
    }

    [HttpPost("years/{id:guid}/close")]
    [Authorize(Policy = PermissionCatalog.InstitutionAcademicManage)]
    public async Task<IActionResult> CloseYear(Guid id, CancellationToken cancellationToken)
    {
        var actorUserId = HttpContext.GetAuthenticatedUserId();
        var result = await academicStructureService.CloseAcademicYearAsync(actorUserId, id, cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblemResult(result.Error);
    }

    [HttpPost("years/{id:guid}/reopen")]
    [Authorize(Policy = PermissionCatalog.InstitutionAcademicManage)]
    public async Task<IActionResult> ReopenYear(Guid id, CancellationToken cancellationToken)
    {
        var actorUserId = HttpContext.GetAuthenticatedUserId();
        var result = await academicStructureService.ReopenAcademicYearAsync(actorUserId, id, cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblemResult(result.Error);
    }

    [HttpGet("grade-levels")]
    [Authorize(Policy = PermissionCatalog.InstitutionAcademicRead)]
    public async Task<ActionResult<IReadOnlyList<GradeLevelDto>>> ListGradeLevels(CancellationToken cancellationToken)
    {
        var gradeLevels = await academicStructureService.ListGradeLevelsAsync(cancellationToken);
        return Ok(gradeLevels);
    }

    [HttpPost("grade-levels")]
    [Authorize(Policy = PermissionCatalog.InstitutionAcademicManage)]
    public async Task<ActionResult<GradeLevelDto>> CreateGradeLevel(
        [FromBody] CreateGradeLevelRequest request,
        [FromServices] IValidator<CreateGradeLevelRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return this.ToValidationProblem(validation);
        }

        var actorUserId = HttpContext.GetAuthenticatedUserId();
        var result = await academicStructureService.CreateGradeLevelAsync(
            actorUserId,
            new CreateGradeLevelCommand(
                request.Stage,
                request.OfficialGradeNumber,
                request.Code,
                request.DisplayName),
            cancellationToken);

        return result.IsSuccess
            ? StatusCode(StatusCodes.Status201Created, result.Value)
            : this.ToProblemResult(result.Error);
    }

    [HttpGet("sections")]
    [Authorize(Policy = PermissionCatalog.InstitutionAcademicRead)]
    public async Task<ActionResult<IReadOnlyList<SchoolSectionDto>>> ListSections(
        [FromQuery] Guid? academicYearId,
        [FromQuery] Guid? gradeLevelId,
        CancellationToken cancellationToken)
    {
        var sections = await academicStructureService.ListSectionsAsync(academicYearId, gradeLevelId, cancellationToken);
        return Ok(sections);
    }

    [HttpPost("sections")]
    [Authorize(Policy = PermissionCatalog.InstitutionAcademicManage)]
    public async Task<ActionResult<SchoolSectionDto>> CreateSection(
        [FromBody] CreateSchoolSectionRequest request,
        [FromServices] IValidator<CreateSchoolSectionRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return this.ToValidationProblem(validation);
        }

        var actorUserId = HttpContext.GetAuthenticatedUserId();
        var result = await academicStructureService.CreateSectionAsync(
            actorUserId,
            new CreateSchoolSectionCommand(
                request.AcademicYearId,
                request.GradeLevelId,
                request.Code,
                request.Shift,
                request.Capacity),
            cancellationToken);

        return result.IsSuccess
            ? StatusCode(StatusCodes.Status201Created, result.Value)
            : this.ToProblemResult(result.Error);
    }

    [HttpGet("subjects")]
    [Authorize(Policy = PermissionCatalog.InstitutionAcademicRead)]
    public async Task<ActionResult<IReadOnlyList<SubjectDto>>> ListSubjects(CancellationToken cancellationToken)
    {
        var subjects = await academicStructureService.ListSubjectsAsync(cancellationToken);
        return Ok(subjects);
    }

    [HttpPost("subjects")]
    [Authorize(Policy = PermissionCatalog.InstitutionAcademicManage)]
    public async Task<ActionResult<SubjectDto>> CreateSubject(
        [FromBody] CreateSubjectRequest request,
        [FromServices] IValidator<CreateSubjectRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return this.ToValidationProblem(validation);
        }

        var actorUserId = HttpContext.GetAuthenticatedUserId();
        var result = await academicStructureService.CreateSubjectAsync(
            actorUserId,
            new CreateSubjectCommand(request.Code, request.Name),
            cancellationToken);

        return result.IsSuccess
            ? StatusCode(StatusCodes.Status201Created, result.Value)
            : this.ToProblemResult(result.Error);
    }

    [HttpGet("teacher-assignments")]
    [Authorize(Policy = PermissionCatalog.InstitutionAcademicRead)]
    public async Task<ActionResult<IReadOnlyList<TeacherAssignmentDto>>> ListTeacherAssignments(
        [FromQuery] Guid? academicYearId,
        [FromQuery] Guid? sectionId,
        CancellationToken cancellationToken)
    {
        var assignments = await academicStructureService.ListTeacherAssignmentsAsync(
            academicYearId,
            sectionId,
            cancellationToken);
        return Ok(assignments);
    }

    [HttpPost("teacher-assignments")]
    [Authorize(Policy = PermissionCatalog.InstitutionAcademicManage)]
    public async Task<ActionResult<TeacherAssignmentDto>> AssignTeacher(
        [FromBody] AssignTeacherRequest request,
        [FromServices] IValidator<AssignTeacherRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return this.ToValidationProblem(validation);
        }

        var actorUserId = HttpContext.GetAuthenticatedUserId();
        var result = await academicStructureService.AssignTeacherAsync(
            actorUserId,
            new AssignTeacherCommand(
                request.SectionId,
                request.SubjectId,
                request.TeacherMembershipId,
                request.WeeklyHours),
            cancellationToken);

        return result.IsSuccess
            ? StatusCode(StatusCodes.Status201Created, result.Value)
            : this.ToProblemResult(result.Error);
    }
}
