using FluentValidation;
using Knorooms.Api.Common;
using Knorooms.Modules.Modules.Entitlements.Contracts;
using Knorooms.Modules.Modules.Platform.Contracts;
using Knorooms.SharedKernel.Authorization;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace Knorooms.Api.Controllers;

[ApiController]
[Route("api/platform/institution-management")]
public sealed class InstitutionManagementController(IInstitutionManagementService management, IInstitutionModulesService modules) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = PermissionCatalog.PlatformInstitutionsRead)]
    public async Task<IActionResult> List(string? search, string? status, string? administrator, int page = 1, int pageSize = 10, CancellationToken cancellationToken = default)
    { var result = await management.ListAsync(search, status, administrator, page, pageSize, cancellationToken); return result.IsSuccess ? Ok(result.Value) : this.ToProblemResult(result.Error); }
    [HttpGet("dashboard")]
    [Authorize(Policy = PermissionCatalog.PlatformInstitutionsRead)]
    public async Task<IActionResult> Dashboard(CancellationToken cancellationToken)
    {
        var result = await management.DashboardAsync(cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblemResult(result.Error);
    }
    [HttpGet("slug-availability")]
    [Authorize(Policy = PermissionCatalog.PlatformInstitutionsRead)]
    public async Task<IActionResult> Slug(string slug, CancellationToken cancellationToken)
    { var result = await management.IsSlugAvailableAsync(slug, cancellationToken); return result.IsSuccess ? Ok(new { available = result.Value }) : this.ToProblemResult(result.Error); }
    [HttpPost]
    [Authorize(Policy = PermissionCatalog.PlatformInstitutionsManage)]
    public async Task<IActionResult> Create(ProvisionInstitutionCommand command, IValidator<ProvisionInstitutionCommand> validator, CancellationToken cancellationToken)
    { var validation = await validator.ValidateAsync(command, cancellationToken); if (!validation.IsValid) return this.ToValidationProblem(validation); var result = await management.CreateAsync(command, cancellationToken); return result.IsSuccess ? StatusCode(201, result.Value) : this.ToProblemResult(result.Error); }
    [HttpGet("{id:guid}/modules")]
    [Authorize(Policy = PermissionCatalog.PlatformInstitutionsRead)]
    public async Task<IActionResult> GetModules(Guid id, CancellationToken cancellationToken)
    { var result = await modules.GetAsync(id, cancellationToken); return result.IsSuccess ? Ok(result.Value) : this.ToProblemResult(result.Error); }
    [HttpPut("{id:guid}/modules")]
    [Authorize(Policy = PermissionCatalog.PlatformInstitutionsManage)]
    public async Task<IActionResult> UpdateModules(Guid id, UpdateInstitutionModulesCommand command, CancellationToken cancellationToken)
    { var result = await modules.UpdateAsync(id, command, cancellationToken); return result.IsSuccess ? Ok(result.Value) : this.ToProblemResult(result.Error); }
}
public sealed class ProvisionInstitutionValidator : AbstractValidator<ProvisionInstitutionCommand>
{
    public ProvisionInstitutionValidator()
    {
        RuleFor(x => x.Name).NotEmpty().Length(3, 160); RuleFor(x => x.Slug).NotEmpty().MaximumLength(63).Must(HostSubdomainParser.IsValidTenantSlug);
        RuleFor(x => x.ContactEmail).NotEmpty().EmailAddress().MaximumLength(320); RuleFor(x => x.ContactName).NotNull().MaximumLength(160);
        RuleFor(x => x.Phone).NotNull().MaximumLength(40); RuleFor(x => x.Address).NotNull().MaximumLength(500); RuleFor(x => x.LogoUrl).NotNull().MaximumLength(1000);
        RuleFor(x => x.TimeZoneId).NotEmpty().MaximumLength(64); RuleFor(x => x.EnabledModules).NotNull().Must(x => x is not null && x.Length <= ProductModuleCatalog.All.Count);
    }
}
