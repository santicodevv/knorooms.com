using System.Text.Json;
using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Audit.Contracts;
using Knorooms.Modules.Modules.Entitlements.Contracts;
using Knorooms.Modules.Modules.Entitlements.Domain;
using Knorooms.Modules.Modules.Tenants.Contracts;
using Knorooms.SharedKernel.Results;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;
namespace Knorooms.Modules.Modules.Entitlements.Application;

internal sealed class InstitutionModulesService(ApplicationDbContext db, ITenantContextAccessor context, IAuditWriter audit, IInstitutionProfileService profiles) : IInstitutionModulesService
{
    public async Task<Result<InstitutionModulesDto>> GetAsync(Guid institutionId, CancellationToken cancellationToken = default)
    {
        if (context.Current.ExecutionMode != DatabaseExecutionMode.Platform) return Result.Failure<InstitutionModulesDto>(Denied());
        var profile = await profiles.GetAsync(institutionId, cancellationToken);
        if (profile.IsFailure) return Result.Failure<InstitutionModulesDto>(profile.Error);
        using var scope = context.BeginScope(context.Current with { TenantId = institutionId, ExecutionMode = DatabaseExecutionMode.PlatformCommercial });
        return Result.Success(await ReadAsync(cancellationToken));
    }
    public async Task<Result<InstitutionModulesDto>> UpdateAsync(Guid institutionId, UpdateInstitutionModulesCommand command, CancellationToken cancellationToken = default)
    {
        if (context.Current.ExecutionMode != DatabaseExecutionMode.Platform) return Result.Failure<InstitutionModulesDto>(Denied());
        var profile = await profiles.GetAsync(institutionId, cancellationToken);
        if (profile.IsFailure) return Result.Failure<InstitutionModulesDto>(profile.Error);
        using var scope = context.BeginScope(context.Current with { TenantId = institutionId, ExecutionMode = DatabaseExecutionMode.PlatformCommercial });
        var ownTransaction = db.Database.CurrentTransaction is null;
        await using var transaction = ownTransaction ? await db.Database.BeginTransactionAsync(cancellationToken) : null;
        await db.LockCommercialTenantAsync(institutionId, cancellationToken);
        var entity = await db.InstitutionModuleSettings.SingleOrDefaultAsync(cancellationToken);
        if ((entity is null && command.Version is not null) || (entity is not null && command.Version != entity.Version))
            return Result.Failure<InstitutionModulesDto>(Error.Conflict("Modules.Modified", "Los módulos cambiaron. Actualice antes de guardar."));
        var before = entity?.EnabledModules ?? [];
        var isNew = entity is null; entity ??= new(institutionId);
        var result = entity.Update(command.EnabledModules);
        if (result.IsFailure) return Result.Failure<InstitutionModulesDto>(result.Error);
        if (isNew) db.InstitutionModuleSettings.Add(entity);
        audit.Record(institutionId, "institution.modules.updated", institutionId.ToString(), "Módulos institucionales actualizados. Los datos históricos se conservan.",
            new Dictionary<string, string?> { ["before"] = JsonSerializer.Serialize(before), ["after"] = JsonSerializer.Serialize(entity.EnabledModules) });
        await db.SaveChangesAsync(cancellationToken);
        if (transaction is not null) await transaction.CommitAsync(cancellationToken);
        return Result.Success(await ReadAsync(cancellationToken));
    }
    private async Task<InstitutionModulesDto> ReadAsync(CancellationToken ct)
    {
        var row = await db.InstitutionModuleSettings.AsNoTracking().SingleOrDefaultAsync(ct);
        return new(row?.EnabledModules ?? [], row?.Version, new("Configured", null, row?.MaxActiveStudents, row?.MaxSections, ProductModuleCatalog.Resolve(row?.EnabledModules ?? [], "Active")));
    }
    private static Error Denied() => Error.Forbidden("Modules.PlatformRequired", "Requiere administración global.");
}
