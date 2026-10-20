using FluentValidation;
using Knorooms.Api.Common;
using Knorooms.Api.Contracts;
using Knorooms.Modules.Modules.Attendance.Contracts;
using Knorooms.SharedKernel.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Knorooms.Api.Controllers;

[ApiController]
[Route("api/tenant/attendance")]
[Authorize]
public sealed class AttendanceController(IAttendanceService attendanceService) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = PermissionCatalog.InstitutionAttendanceRead)]
    [ProducesResponseType<SectionAttendanceOverviewDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOverview(
        [FromQuery] Guid? academicYearId,
        [FromQuery] Guid? sectionId,
        [FromQuery] DateOnly? attendanceDate,
        CancellationToken cancellationToken)
    {
        var overview = await attendanceService.GetSectionAttendanceOverviewAsync(
            academicYearId,
            sectionId,
            attendanceDate,
            cancellationToken);

        return Ok(overview);
    }

    [HttpPost("batch")]
    [Authorize(Policy = PermissionCatalog.InstitutionAttendanceRecord)]
    [ProducesResponseType<AttendanceBatchRecordResultDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> RecordBatch(
        [FromBody] RecordSectionAttendanceBatchRequest request,
        [FromServices] IValidator<RecordSectionAttendanceBatchRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return this.ToValidationProblem(validation);
        }

        var result = await attendanceService.RecordSectionAttendanceBatchAsync(
            new RecordSectionAttendanceBatchCommand(
                request.SectionId,
                request.AttendanceDate,
                request.Entries
                    .Select(e => new AttendanceEntryInput(e.EnrollmentId, e.Status, e.JustificationNote))
                    .ToList()),
            cancellationToken);

        return result.IsSuccess
            ? Ok(result.Value)
            : this.ToProblemResult(result.Error);
    }
}
