using Knorooms.Api.Common;
using Knorooms.Api.Security;
using Knorooms.Modules.Modules.Audit.Contracts;
using Knorooms.Modules.Modules.Authorization.Contracts;
using Knorooms.Modules.Modules.SupportAccess.Contracts;
using Knorooms.Modules.Modules.Tenants.Contracts;
using Knorooms.SharedKernel.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Knorooms.Api.Controllers;

[ApiController]
[Route("api/tenant")]
public sealed class TenantController(
    ITenantAuthorizationService tenantAuthorizationService,
    ISupportAccessService supportAccessService,
    IAuditQueryService auditQueryService) : ControllerBase
{
    [HttpGet("context")]
    [Authorize(Policy = PermissionCatalog.InstitutionContextRead)]
    public ActionResult<TenantAccessContextDto> GetContext()
    {
        var institution = HttpContext.Items[TenantAndIdentityResolutionMiddleware.TenantInstitutionDtoItemKey] as InstitutionDto;
        var resolvedAccess = HttpContext.Items[TenantAndIdentityResolutionMiddleware.TenantAccessHttpContextItemKey] as ResolvedTenantAccess;

        if (institution is null || resolvedAccess is null || !resolvedAccess.HasAccess)
        {
            return Forbid();
        }

        return Ok(new TenantAccessContextDto(
            institution,
            resolvedAccess.AccessType,
            resolvedAccess.MembershipId,
            resolvedAccess.Roles,
            resolvedAccess.EffectivePermissions.OrderBy(p => p, StringComparer.Ordinal).ToList(),
            resolvedAccess.SupportAccessExpiresAtUtc));
    }

    [HttpGet("members")]
    [Authorize(Policy = PermissionCatalog.InstitutionMembersRead)]
    public async Task<ActionResult<IReadOnlyList<MemberDto>>> ListMembers(CancellationToken cancellationToken)
    {
        var members = await tenantAuthorizationService.ListMembersAsync(cancellationToken);
        return Ok(members);
    }

    [HttpPost("members/{membershipId:guid}/revoke")]
    [Authorize(Policy = PermissionCatalog.InstitutionMembersManage)]
    public async Task<IActionResult> RevokeMember(Guid membershipId, CancellationToken cancellationToken)
    {
        var actorUserId = HttpContext.GetAuthenticatedUserId();
        var result = await tenantAuthorizationService.RevokeMemberAsync(membershipId, actorUserId, cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblemResult(result.Error);
    }

    [HttpGet("roles")]
    [Authorize(Policy = PermissionCatalog.InstitutionRolesRead)]
    public async Task<ActionResult<IReadOnlyList<RoleDto>>> ListRoles(CancellationToken cancellationToken)
    {
        var roles = await tenantAuthorizationService.ListRolesAsync(cancellationToken);
        return Ok(roles);
    }

    [HttpGet("support-access")]
    [Authorize(Policy = PermissionCatalog.InstitutionSupportAccessRead)]
    public async Task<ActionResult<IReadOnlyList<SupportAccessGrantDto>>> ListSupportAccessGrants(
        CancellationToken cancellationToken)
    {
        var grants = await supportAccessService.ListForCurrentTenantAsync(cancellationToken);
        return Ok(grants);
    }

    [HttpPost("support-access/{id:guid}/approve")]
    [Authorize(Policy = PermissionCatalog.InstitutionSupportAccessManage)]
    public async Task<IActionResult> ApproveSupportAccess(Guid id, CancellationToken cancellationToken)
    {
        var actorUserId = HttpContext.GetAuthenticatedUserId();
        var result = await supportAccessService.ApproveAsync(id, actorUserId, cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblemResult(result.Error);
    }

    [HttpPost("support-access/{id:guid}/reject")]
    [Authorize(Policy = PermissionCatalog.InstitutionSupportAccessManage)]
    public async Task<IActionResult> RejectSupportAccess(Guid id, CancellationToken cancellationToken)
    {
        var actorUserId = HttpContext.GetAuthenticatedUserId();
        var result = await supportAccessService.RejectAsync(id, actorUserId, cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblemResult(result.Error);
    }

    [HttpPost("support-access/{id:guid}/revoke")]
    [Authorize(Policy = PermissionCatalog.InstitutionSupportAccessManage)]
    public async Task<IActionResult> RevokeSupportAccess(Guid id, CancellationToken cancellationToken)
    {
        var actorUserId = HttpContext.GetAuthenticatedUserId();
        var result = await supportAccessService.RevokeAsync(id, actorUserId, cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblemResult(result.Error);
    }

    [HttpGet("audit-logs")]
    [Authorize(Policy = PermissionCatalog.InstitutionAuditRead)]
    public async Task<ActionResult<IReadOnlyList<AuditLogEntryDto>>> ListTenantAuditLogs(
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
    {
        var entries = await auditQueryService.ListForCurrentTenantAsync(limit, cancellationToken);
        return Ok(entries);
    }
}
