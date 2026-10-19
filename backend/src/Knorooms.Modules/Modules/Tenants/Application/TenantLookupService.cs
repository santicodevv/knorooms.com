using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Tenants.Contracts;
using Microsoft.EntityFrameworkCore;

namespace Knorooms.Modules.Modules.Tenants.Application;

internal sealed class TenantLookupService(ApplicationDbContext dbContext) : ITenantLookupService
{
    public async Task<InstitutionDto?> FindBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(slug))
        {
            return null;
        }

        var normalized = slug.Trim().ToLowerInvariant();
        return await dbContext.Institutions
            .AsNoTracking()
            .Where(i => i.Slug == normalized)
            .Select(i => new InstitutionDto(
                i.Id,
                i.Slug,
                i.Name,
                i.Status.ToString(),
                i.CreatedAtUtc))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
