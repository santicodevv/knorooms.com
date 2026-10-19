using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Audit.Contracts;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace Knorooms.Modules.Modules.Audit.Application;

internal sealed class AuditQueryService(
    ApplicationDbContext dbContext,
    ITenantContextAccessor tenantContextAccessor) : IAuditQueryService
{
    public async Task<IReadOnlyList<AuditLogEntryDto>> ListForCurrentTenantAsync(
        int limit = 50,
        CancellationToken cancellationToken = default)
    {
        var tenantId = tenantContextAccessor.Current.TenantId;
        if (tenantId is null)
        {
            return [];
        }

        var clampedLimit = Math.Clamp(limit, 1, 200);
        return await dbContext.AuditLogs
            .AsNoTracking()
            .Where(a => a.TenantId == tenantId.Value)
            .OrderByDescending(a => a.CreatedAtUtc)
            .Take(clampedLimit)
            .Select(a => new AuditLogEntryDto(
                a.Id,
                a.TenantId,
                a.ActorUserId,
                a.ActorAccessType,
                a.SupportAccessGrantId,
                a.Action,
                a.ResourceType,
                a.ResourceId,
                a.Summary,
                a.CreatedAtUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<AuditLogEntryDto>> ListForPlatformAsync(
        int limit = 50,
        CancellationToken cancellationToken = default)
    {
        var clampedLimit = Math.Clamp(limit, 1, 200);
        return await dbContext.AuditLogs
            .AsNoTracking()
            .OrderByDescending(a => a.CreatedAtUtc)
            .Take(clampedLimit)
            .Select(a => new AuditLogEntryDto(
                a.Id,
                a.TenantId,
                a.ActorUserId,
                a.ActorAccessType,
                a.SupportAccessGrantId,
                a.Action,
                a.ResourceType,
                a.ResourceId,
                a.Summary,
                a.CreatedAtUtc))
            .ToListAsync(cancellationToken);
    }
}
