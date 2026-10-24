using FluentValidation;
using Knorooms.Api.Common;
using Knorooms.Modules.Modules.Subscriptions.Contracts;
using Knorooms.Modules.Modules.Entitlements.Contracts;
using Knorooms.SharedKernel.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace Knorooms.Api.Controllers;

[ApiController]
[Route("api/platform")]
public sealed class SubscriptionsController(ISubscriptionService subscriptions) : ControllerBase
{
    [HttpGet("plans")]
    [Authorize(Policy = PermissionCatalog.PlatformInstitutionsRead)]
    public async Task<IActionResult> Plans(CancellationToken cancellationToken) => Ok(await subscriptions.ListPlansAsync(cancellationToken));
    [HttpGet("product-modules")]
    [Authorize(Policy = PermissionCatalog.PlatformInstitutionsRead)]
    public IActionResult Modules() => Ok(ProductModuleCatalog.All);
    [HttpPost("plans")]
    [Authorize(Policy = PermissionCatalog.PlatformInstitutionsManage)]
    public async Task<IActionResult> Create(CreatePlanCommand command, IValidator<CreatePlanCommand> validator, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(command, cancellationToken);
        if (!validation.IsValid) return this.ToValidationProblem(validation);
        var result = await subscriptions.CreatePlanAsync(command, cancellationToken);
        return result.IsSuccess ? StatusCode(201, result.Value) : this.ToProblemResult(result.Error);
    }
    [HttpGet("institutions/{id:guid}/subscription")]
    [Authorize(Policy = PermissionCatalog.PlatformInstitutionsRead)]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var result = await subscriptions.GetAsync(id, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblemResult(result.Error);
    }
    [HttpPut("institutions/{id:guid}/subscription")]
    [Authorize(Policy = PermissionCatalog.PlatformInstitutionsManage)]
    public async Task<IActionResult> Assign(Guid id, AssignSubscriptionCommand command, IValidator<AssignSubscriptionCommand> validator, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(command, cancellationToken);
        if (!validation.IsValid) return this.ToValidationProblem(validation);
        var result = await subscriptions.AssignAsync(id, command, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblemResult(result.Error);
    }
}
[ApiController]
[Route("api/tenant/capabilities")]
public sealed class CapabilitiesController(IEntitlementService entitlements) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = PermissionCatalog.InstitutionContextRead)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken) => Ok(await entitlements.GetCurrentAsync(cancellationToken));
}
public sealed class CreatePlanValidator : AbstractValidator<CreatePlanCommand>
{
    public CreatePlanValidator()
    {
        RuleFor(x => x.Code).NotEmpty().Matches("^[a-zA-Z0-9_-]{1,40}$"); RuleFor(x => x.Name).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Description).NotNull().MaximumLength(2000); RuleFor(x => x.Revision).GreaterThan(0);
        RuleFor(x => x.Price).InclusiveBetween(0, 9999999999999999.99m).When(x => x.Price.HasValue);
        RuleFor(x => x.Currency).NotEmpty().Matches("^[A-Z]{3}$").When(x => x.Price.HasValue);
        RuleFor(x => x.BillingPeriod).Must(x => x is "Monthly" or "Annual" or "Custom");
        RuleFor(x => x.MaxActiveStudents).GreaterThan(0).When(x => x.MaxActiveStudents.HasValue);
        RuleFor(x => x.MaxSections).GreaterThan(0).When(x => x.MaxSections.HasValue);
        RuleFor(x => x.Modules).NotNull().Must(x => x is not null && x.Length <= ProductModuleCatalog.All.Count && ProductModuleCatalog.IsValidSelection(x));
    }
}
public sealed class AssignSubscriptionValidator : AbstractValidator<AssignSubscriptionCommand>
{
    public AssignSubscriptionValidator()
    {
        RuleFor(x => x.PlanVersionId).NotEmpty(); RuleFor(x => x.StartsAtUtc).NotEmpty(); RuleFor(x => x.EndsAtUtc).GreaterThan(x => x.StartsAtUtc);
        RuleFor(x => x.Status).Must(x => x is "Active" or "Suspended" or "Cancelled"); RuleFor(x => x.Reason).NotEmpty().MaximumLength(1000);
        RuleFor(x => x.Overrides).NotNull().Must(x => x is not null && x.Length <= ProductModuleCatalog.All.Count && x.All(i => i is not null && ProductModuleCatalog.All.Any(m => m.Code == i.Code)));
    }
}
