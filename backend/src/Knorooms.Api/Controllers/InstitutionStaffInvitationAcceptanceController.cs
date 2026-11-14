using FluentValidation;
using Knorooms.Api.Common;
using Knorooms.Modules.Modules.Identity.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Knorooms.Api.Controllers;

[ApiController]
[Route("api/invitations/staff")]
public sealed class InstitutionStaffInvitationAcceptanceController(
    IInstitutionStaffInvitationService staffInvitationService) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("accept")]
    [EnableRateLimiting("invitation-acceptance")]
    public async Task<IActionResult> Accept(
        [FromBody] AcceptInstitutionStaffInvitationCommand command,
        [FromServices] IValidator<AcceptInstitutionStaffInvitationCommand> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(command, cancellationToken);

        if (!validation.IsValid)
            return this.ToValidationProblem(validation);

        Response.Headers.CacheControl = "no-store";

        await staffInvitationService.AcceptAsync(command, cancellationToken);

        return NoContent();
    }
}

public sealed class AcceptInstitutionStaffInvitationValidator
    : AbstractValidator<AcceptInstitutionStaffInvitationCommand>
{
    public AcceptInstitutionStaffInvitationValidator()
    {
        RuleFor(x => x.InvitationId).NotEmpty();

        RuleFor(x => x.Token)
            .NotEmpty()
            .Matches("^[A-Fa-f0-9]{64}$");

        RuleFor(x => x.DisplayName)
            .NotEmpty()
            .Length(2, 160);

        RuleFor(x => x.Password)
            .NotEmpty()
            .MaximumLength(128);
    }
}
