using Knorooms.Modules.Modules.Entitlements.Contracts;
using Knorooms.Modules.Modules.Subscriptions.Contracts;
using Knorooms.SharedKernel.Results;
using Knorooms.Modules.Common.Persistence;
using Microsoft.EntityFrameworkCore;
namespace Knorooms.Modules.Modules.Entitlements.Application;
internal sealed class EntitlementService(ISubscriptionService subscriptions, ApplicationDbContext db) : IEntitlementService
{
    public async Task<EffectiveAccessDto> GetCurrentAsync(CancellationToken cancellationToken = default)
    {
        var direct = await db.InstitutionModuleSettings.AsNoTracking().SingleOrDefaultAsync(cancellationToken);
        return direct is null ? (await subscriptions.GetCurrentAsync(cancellationToken)).Access :
            new("Configured", null, direct.MaxActiveStudents, direct.MaxSections, ProductModuleCatalog.Resolve(direct.EnabledModules, "Active"));
    }
    public async Task<Result> EnsureCanWriteAsync(string moduleCode, CancellationToken cancellationToken = default)
    {
        var access = await GetCurrentAsync(cancellationToken);
        var feature = access.Modules.FirstOrDefault(x => x.Code == moduleCode);
        return feature?.CanWrite == true ? Result.Success() : Result.Failure(Error.Forbidden("Entitlement.ReadOnly", feature?.Reason ?? "Módulo no disponible."));
    }
}
