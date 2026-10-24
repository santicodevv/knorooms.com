using FluentValidation;
using Knorooms.Api.Common;
using Knorooms.Modules.Modules.Identity.Contracts;
using Knorooms.Modules.Modules.Platform.Contracts;
using Knorooms.Modules.Modules.Tenants.Contracts;
using Knorooms.SharedKernel.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Knorooms.Api.Controllers;

[ApiController]
[Route("api/platform/institutions/{id:guid}")]
public sealed class InstitutionSetupController(IInstitutionSetupService setup, IInstitutionProfileService profiles) : ControllerBase
{
    [HttpGet("setup")]
    [Authorize(Policy = PermissionCatalog.PlatformInstitutionsRead)]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var result = await setup.GetAsync(id, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblemResult(result.Error);
    }
    [HttpPut("profile")]
    [Authorize(Policy = PermissionCatalog.PlatformInstitutionsManage)]
    public async Task<IActionResult> Update(Guid id, UpdateInstitutionProfileCommand command,
        IValidator<UpdateInstitutionProfileCommand> validator, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(command, cancellationToken);
        if (!validation.IsValid) return this.ToValidationProblem(validation);
        var result = await profiles.UpdateAsync(id, HttpContext.GetAuthenticatedUserId(), command, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblemResult(result.Error);
    }
    [HttpPost("invitations")]
    [Authorize(Policy = PermissionCatalog.PlatformInstitutionsManage)]
    public async Task<IActionResult> Invite(Guid id, InviteAdministratorRequest request,
        IValidator<InviteAdministratorRequest> validator, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return this.ToValidationProblem(validation);
        var result = await setup.InviteAsync(id, request.Email, cancellationToken);
        return result.IsSuccess ? StatusCode(201, result.Value) : this.ToProblemResult(result.Error);
    }
    [HttpPost("invitations/{invitationId:guid}/resend")]
    [Authorize(Policy = PermissionCatalog.PlatformInstitutionsManage)]
    public async Task<IActionResult> Resend(Guid id, Guid invitationId, CancellationToken cancellationToken)
    { var result = await setup.ResendAsync(id, invitationId, cancellationToken); return result.IsSuccess ? StatusCode(201, result.Value) : this.ToProblemResult(result.Error); }
    [HttpPost("invitations/{invitationId:guid}/revoke")]
    [Authorize(Policy = PermissionCatalog.PlatformInstitutionsManage)]
    public async Task<IActionResult> Revoke(Guid id, Guid invitationId, CancellationToken cancellationToken)
    {
        var result = await setup.RevokeAsync(id, invitationId, cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblemResult(result.Error);
    }
}

public sealed record InviteAdministratorRequest(string Email);
public sealed class InviteAdministratorRequestValidator : AbstractValidator<InviteAdministratorRequest>
{
    public InviteAdministratorRequestValidator() => RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(320);
}
public sealed class UpdateInstitutionProfileValidator : AbstractValidator<UpdateInstitutionProfileCommand>
{
    public UpdateInstitutionProfileValidator()
    {
        RuleFor(x => x.Name).NotEmpty().Length(3, 160);
        RuleFor(x => x.ContactName).NotNull().MaximumLength(160);
        RuleFor(x => x.ContactEmail).NotNull().MaximumLength(320);
        RuleFor(x => x.ContactEmail).EmailAddress().When(x => !string.IsNullOrEmpty(x.ContactEmail));
        RuleFor(x => x.Phone).NotNull().MaximumLength(40);
        RuleFor(x => x.Address).NotNull().MaximumLength(500);
        RuleFor(x => x.CenterCode).NotNull().MaximumLength(50);
        RuleFor(x => x.LogoUrl).NotNull().MaximumLength(1000);
        RuleFor(x => x.TimeZoneId).NotEmpty().MaximumLength(64);
        RuleFor(x => x.OnboardingOwner).NotNull().MaximumLength(160);
        RuleFor(x => x.OnboardingNotes).NotNull().MaximumLength(2000);
    }
}

[ApiController]
[Route("api/invitations")]
public sealed class InvitationAcceptanceController(IInstitutionSetupService setup) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("accept")]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("invitation-acceptance")]
    public async Task<IActionResult> Accept(AcceptAdministratorInvitationCommand command,
        IValidator<AcceptAdministratorInvitationCommand> validator, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(command, cancellationToken);
        if (!validation.IsValid) return this.ToValidationProblem(validation);
        Response.Headers.CacheControl = "no-store";
        var result = await setup.AcceptAsync(command, cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblemResult(result.Error);
    }
}
public sealed class AcceptAdministratorInvitationValidator : AbstractValidator<AcceptAdministratorInvitationCommand>
{
    public AcceptAdministratorInvitationValidator()
    {
        RuleFor(x => x.InvitationId).NotEmpty();
        RuleFor(x => x.Token).NotEmpty().Matches("^[A-Fa-f0-9]{64}$");
        RuleFor(x => x.DisplayName).NotEmpty().Length(2, 160);
        RuleFor(x => x.Password).NotEmpty().MaximumLength(128);
    }
}
