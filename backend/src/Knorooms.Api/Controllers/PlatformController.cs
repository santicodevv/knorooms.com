using FluentValidation;
using Knorooms.Api.Common;
using Knorooms.Api.Contracts;
using Knorooms.Modules.Modules.Audit.Contracts;
using Knorooms.Modules.Modules.Platform.Contracts;
using Knorooms.Modules.Modules.SupportAccess.Contracts;
using Knorooms.Modules.Modules.Tenants.Contracts;
using Knorooms.SharedKernel.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Knorooms.Api.Controllers;

[ApiController]
[Route("api/platform")]
public sealed class PlatformController(
    IPlatformInstitutionService platformInstitutionService,
    ISupportAccessService supportAccessService,
    IAuditQueryService auditQueryService) : ControllerBase
{
    [HttpGet("institutions")]
    [Authorize(Policy = PermissionCatalog.PlatformInstitutionsRead)]
    public async Task<ActionResult<IReadOnlyList<InstitutionDto>>> ListInstitutions(CancellationToken cancellationToken)
    {
        var items = await platformInstitutionService.ListInstitutionsAsync(cancellationToken);
        return Ok(items);
    }

    [HttpGet("institutions/{id:guid}")]
    [Authorize(Policy = PermissionCatalog.PlatformInstitutionsRead)]
    public async Task<ActionResult<InstitutionDto>> GetInstitution(Guid id, CancellationToken cancellationToken)
    {
        var result = await platformInstitutionService.GetInstitutionByIdAsync(id, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblemResult(result.Error);
    }

    [HttpPost("institutions")]
    [Authorize(Policy = PermissionCatalog.PlatformInstitutionsManage)]
    public async Task<ActionResult<InstitutionDto>> CreateInstitution(
        [FromBody] CreateInstitutionRequest request,
        [FromServices] IValidator<CreateInstitutionRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return this.ToValidationProblem(validation);
        }

        var actorUserId = HttpContext.GetAuthenticatedUserId();
        var result = await platformInstitutionService.CreateInstitutionAsync(
            actorUserId,
            new CreateInstitutionCommand(request.Slug, request.Name),
            cancellationToken);

        return result.IsSuccess
            ? CreatedAtAction(nameof(GetInstitution), new { id = result.Value.Id }, result.Value)
            : this.ToProblemResult(result.Error);
    }

    [HttpPost("institutions/{id:guid}/suspend")]
    [Authorize(Policy = PermissionCatalog.PlatformInstitutionsManage)]
    public async Task<IActionResult> SuspendInstitution(Guid id, CancellationToken cancellationToken)
    {
        var actorUserId = HttpContext.GetAuthenticatedUserId();
        var result = await platformInstitutionService.SuspendInstitutionAsync(actorUserId, id, cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblemResult(result.Error);
    }

    [HttpPost("institutions/{id:guid}/activate")]
    [Authorize(Policy = PermissionCatalog.PlatformInstitutionsManage)]
    public async Task<IActionResult> ActivateInstitution(Guid id, CancellationToken cancellationToken)
    {
        var actorUserId = HttpContext.GetAuthenticatedUserId();
        var result = await platformInstitutionService.ActivateInstitutionAsync(actorUserId, id, cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblemResult(result.Error);
    }

    [HttpPost("institutions/{id:guid}/administrators")]
    [Authorize(Policy = PermissionCatalog.PlatformInstitutionsManage)]
    public async Task<ActionResult<AssignedAdministratorResultDto>> AssignInitialAdministrator(
        Guid id,
        [FromBody] AssignInstitutionAdministratorRequest request,
        [FromServices] IValidator<AssignInstitutionAdministratorRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return this.ToValidationProblem(validation);
        }

        var actorUserId = HttpContext.GetAuthenticatedUserId();
        var result = await platformInstitutionService.AssignInitialAdministratorAsync(
            actorUserId,
            new AssignInitialAdministratorCommand(id, request.Email),
            cancellationToken);

        return result.IsSuccess
            ? StatusCode(StatusCodes.Status201Created, result.Value)
            : this.ToProblemResult(result.Error);
    }

    [HttpGet("support-access-requests")]
    [Authorize(Policy = PermissionCatalog.PlatformSupportRequestAccess)]
    public async Task<ActionResult<IReadOnlyList<SupportAccessGrantDto>>> ListSupportAccessRequests(
        CancellationToken cancellationToken)
    {
        var grants = await supportAccessService.ListPlatformRequestsAsync(cancellationToken);
        return Ok(grants);
    }

    [HttpPost("support-access-requests")]
    [Authorize(Policy = PermissionCatalog.PlatformSupportRequestAccess)]
    public async Task<ActionResult<SupportAccessGrantDto>> RequestSupportAccess(
        [FromBody] CreateSupportAccessRequest request,
        [FromServices] IValidator<CreateSupportAccessRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return this.ToValidationProblem(validation);
        }

        var actorUserId = HttpContext.GetAuthenticatedUserId();
        var result = await supportAccessService.RequestAccessAsync(
            actorUserId,
            new RequestSupportAccessCommand(
                request.TenantId,
                request.Reason,
                request.Permissions,
                request.DurationMinutes),
            cancellationToken);

        return result.IsSuccess
            ? StatusCode(StatusCodes.Status201Created, result.Value)
            : this.ToProblemResult(result.Error);
    }

    [HttpGet("audit-logs")]
    [Authorize(Policy = PermissionCatalog.PlatformAuditRead)]
    public async Task<ActionResult<IReadOnlyList<AuditLogEntryDto>>> ListPlatformAuditLogs(
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
    {
        var entries = await auditQueryService.ListForPlatformAsync(limit, cancellationToken);
        return Ok(entries);
    }
}
