using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Audit.Domain;
using Knorooms.Modules.Modules.SupportAccess.Contracts;
using Knorooms.Modules.Modules.SupportAccess.Domain;
using Knorooms.SharedKernel.Results;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace Knorooms.Modules.Modules.SupportAccess.Application;

internal sealed class SupportAccessService(
    ApplicationDbContext dbContext,
    ITenantContextAccessor tenantContextAccessor) : ISupportAccessService
{
    public async Task<Result<SupportAccessGrantDto>> RequestAccessAsync(
        Guid requestedByUserId,
        RequestSupportAccessCommand command,
        CancellationToken cancellationToken = default)
    {
        var institutionExists = await dbContext.Institutions
            .AsNoTracking()
            .AnyAsync(i => i.Id == command.TenantId, cancellationToken);

        if (!institutionExists)
        {
            return Result.Failure<SupportAccessGrantDto>(Error.NotFound(
                "Institution.NotFound",
                "La institución solicitada no existe."));
        }

        var grantResult = SupportAccessGrant.Request(
            command.TenantId,
            requestedByUserId,
            command.Reason,
            command.Permissions,
            command.DurationMinutes);

        if (grantResult.IsFailure)
        {
            return Result.Failure<SupportAccessGrantDto>(grantResult.Error);
        }

        var grant = grantResult.Value;
        var currentScope = tenantContextAccessor.Current;
        using var supportScope = tenantContextAccessor.BeginScope(currentScope with
        {
            TenantId = command.TenantId,
            UserId = requestedByUserId,
            ExecutionMode = DatabaseExecutionMode.PlatformSupport
        });

        dbContext.SupportAccessGrants.Add(grant);
        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: command.TenantId,
            actorUserId: requestedByUserId,
            actorAccessType: "PlatformSupport",
            supportAccessGrantId: grant.Id,
            action: "support_access.requested",
            resourceType: "SupportAccessGrant",
            resourceId: grant.Id.ToString(),
            summary: $"Solicitud de acceso temporal de soporte por {grant.DurationMinutes} minutos."));

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success(MapToDto(grant));
    }

    public async Task<IReadOnlyList<SupportAccessGrantDto>> ListForCurrentTenantAsync(
        CancellationToken cancellationToken = default)
    {
        var tenantId = tenantContextAccessor.Current.TenantId;
        if (tenantId is null)
        {
            return [];
        }

        var grants = await dbContext.SupportAccessGrants
            .AsNoTracking()
            .Where(g => g.TenantId == tenantId.Value)
            .OrderByDescending(g => g.RequestedAtUtc)
            .ToListAsync(cancellationToken);

        return grants.Select(MapToDto).ToList();
    }

    public async Task<IReadOnlyList<SupportAccessGrantDto>> ListPlatformRequestsAsync(
        CancellationToken cancellationToken = default)
    {
        var grants = await dbContext.SupportAccessGrants
            .IgnoreQueryFilters()
            .AsNoTracking()
            .OrderByDescending(g => g.RequestedAtUtc)
            .Take(100)
            .ToListAsync(cancellationToken);

        return grants.Select(MapToDto).ToList();
    }

    public async Task<Result> ApproveAsync(
        Guid grantId,
        Guid actorUserId,
        CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;
        if (scope.TenantId is null)
        {
            return Result.Failure(Error.Forbidden("Tenant.NotResolved", "No hay un contexto institucional activo."));
        }

        var grant = await dbContext.SupportAccessGrants
            .FirstOrDefaultAsync(g => g.TenantId == scope.TenantId.Value && g.Id == grantId, cancellationToken);

        if (grant is null)
        {
            return Result.Failure(Error.NotFound("SupportAccess.NotFound", "La solicitud de soporte no existe en este colegio."));
        }

        var result = grant.Approve(actorUserId);
        if (result.IsFailure)
        {
            return result;
        }

        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: scope.TenantId.Value,
            actorUserId: actorUserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: grant.Id,
            action: "support_access.approved",
            resourceType: "SupportAccessGrant",
            resourceId: grant.Id.ToString(),
            summary: $"Acceso temporal de soporte aprobado hasta {grant.ExpiresAtUtc:O}."));

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    public async Task<Result> RejectAsync(
        Guid grantId,
        Guid actorUserId,
        CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;
        if (scope.TenantId is null)
        {
            return Result.Failure(Error.Forbidden("Tenant.NotResolved", "No hay un contexto institucional activo."));
        }

        var grant = await dbContext.SupportAccessGrants
            .FirstOrDefaultAsync(g => g.TenantId == scope.TenantId.Value && g.Id == grantId, cancellationToken);

        if (grant is null)
        {
            return Result.Failure(Error.NotFound("SupportAccess.NotFound", "La solicitud de soporte no existe en este colegio."));
        }

        var result = grant.Reject(actorUserId);
        if (result.IsFailure)
        {
            return result;
        }

        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: scope.TenantId.Value,
            actorUserId: actorUserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: grant.Id,
            action: "support_access.rejected",
            resourceType: "SupportAccessGrant",
            resourceId: grant.Id.ToString(),
            summary: "Solicitud de acceso temporal de soporte rechazada por la institución."));

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    public async Task<Result> RevokeAsync(
        Guid grantId,
        Guid actorUserId,
        CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;
        if (scope.TenantId is null)
        {
            return Result.Failure(Error.Forbidden("Tenant.NotResolved", "No hay un contexto institucional activo."));
        }

        var grant = await dbContext.SupportAccessGrants
            .FirstOrDefaultAsync(g => g.TenantId == scope.TenantId.Value && g.Id == grantId, cancellationToken);

        if (grant is null)
        {
            return Result.Failure(Error.NotFound("SupportAccess.NotFound", "La concesión de soporte no existe en este colegio."));
        }

        var result = grant.Revoke(actorUserId);
        if (result.IsFailure)
        {
            return result;
        }

        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: scope.TenantId.Value,
            actorUserId: actorUserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: grant.Id,
            action: "support_access.revoked",
            resourceType: "SupportAccessGrant",
            resourceId: grant.Id.ToString(),
            summary: "Acceso temporal de soporte revocado inmediatamente por la institución."));

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    private static SupportAccessGrantDto MapToDto(SupportAccessGrant grant) =>
        new(
            grant.Id,
            grant.TenantId,
            grant.RequestedByUserId,
            grant.Reason,
            grant.Permissions,
            grant.DurationMinutes,
            grant.Status.ToString(),
            grant.RequestedAtUtc,
            grant.ApprovedAtUtc,
            grant.ExpiresAtUtc,
            grant.RevokedAtUtc);
}
