using Knorooms.Api.Common;
using Knorooms.Modules.Modules.Identity.Contracts;
using Knorooms.SharedKernel.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Knorooms.Api.Controllers;

[ApiController]
[Route("api/tenant/staff-invitations")]
[Authorize(Policy = PermissionCatalog.InstitutionMembersManage)]
public sealed class InstitutionStaffInvitationsController(
    IInstitutionStaffInvitationService staffInvitationService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<InstitutionStaffInvitationDto>>> List(
        CancellationToken cancellationToken)
    {
        var invitations = await staffInvitationService.ListAsync(cancellationToken);
        return Ok(invitations);
    }

    [HttpPost]
    public async Task<ActionResult<InstitutionStaffInvitationDto>> Create(
        [FromBody] CreateInstitutionStaffInvitationCommand command,
        CancellationToken cancellationToken)
    {
        var actorUserId = HttpContext.GetAuthenticatedUserId();

        var invitation = await staffInvitationService.CreateAsync(
            command,
            actorUserId,
            cancellationToken);

        return StatusCode(StatusCodes.Status201Created, invitation);
    }

    [HttpPost("{invitationId:guid}/resend")]
    public async Task<IActionResult> Resend(
        Guid invitationId,
        CancellationToken cancellationToken)
    {
        var actorUserId = HttpContext.GetAuthenticatedUserId();

        await staffInvitationService.ResendAsync(
            invitationId,
            actorUserId,
            cancellationToken);

        return NoContent();
    }

    [HttpPost("{invitationId:guid}/revoke")]
    public async Task<IActionResult> Revoke(
        Guid invitationId,
        CancellationToken cancellationToken)
    {
        var actorUserId = HttpContext.GetAuthenticatedUserId();

        await staffInvitationService.RevokeAsync(
            invitationId,
            actorUserId,
            cancellationToken);

        return NoContent();
    }
}