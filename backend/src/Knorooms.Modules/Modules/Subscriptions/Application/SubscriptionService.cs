using System.Text.Json;
using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Audit.Contracts;
using Knorooms.Modules.Modules.Entitlements.Contracts;
using Knorooms.Modules.Modules.Subscriptions.Contracts;
using Knorooms.Modules.Modules.Subscriptions.Domain;
using Knorooms.Modules.Modules.Tenants.Contracts;
using Knorooms.SharedKernel.Results;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;
namespace Knorooms.Modules.Modules.Subscriptions.Application;

internal sealed class SubscriptionService(ApplicationDbContext db, ITenantContextAccessor context, IAuditWriter audit, IInstitutionProfileService profiles) : ISubscriptionService
{
    public async Task<IReadOnlyList<PlanVersionDto>> ListPlansAsync(CancellationToken cancellationToken = default)
    {
        if (context.Current.ExecutionMode != DatabaseExecutionMode.Platform) return [];
        return (await db.PlanVersions.AsNoTracking().OrderBy(x => x.Code).ThenByDescending(x => x.Revision).ToListAsync(cancellationToken)).Select(Map).ToArray();
    }
    public async Task<Result<PlanVersionDto>> CreatePlanAsync(CreatePlanCommand command, CancellationToken cancellationToken = default)
    {
        if (context.Current.ExecutionMode != DatabaseExecutionMode.Platform) return Result.Failure<PlanVersionDto>(Denied());
        var created = PlanVersion.Create(command);
        if (created.IsFailure) return Result.Failure<PlanVersionDto>(created.Error);
        db.PlanVersions.Add(created.Value);
        audit.Record(null, "subscription.plan_created", created.Value.Id.ToString(), "Versión inmutable de plan creada.",
            new Dictionary<string, string?> { ["conditions"] = JsonSerializer.Serialize(command) });
        try { await db.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateException ex) when (ex.InnerException is Npgsql.PostgresException { SqlState: "23505" })
        { return Result.Failure<PlanVersionDto>(Error.Conflict("Plan.DuplicateVersion", "Ese código y versión ya existen. Cree una nueva versión.")); }
        return Result.Success(Map(created.Value));
    }
    public async Task<Result<SubscriptionOverviewDto>> GetAsync(Guid institutionId, CancellationToken cancellationToken = default)
    {
        if (context.Current.ExecutionMode != DatabaseExecutionMode.Platform) return Result.Failure<SubscriptionOverviewDto>(Denied());
        var profile = await profiles.GetAsync(institutionId, cancellationToken);
        if (profile.IsFailure) return Result.Failure<SubscriptionOverviewDto>(profile.Error);
        using var scope = context.BeginScope(context.Current with { TenantId = institutionId, ExecutionMode = DatabaseExecutionMode.PlatformCommercial });
        return Result.Success(await GetCurrentAsync(cancellationToken));
    }
    public async Task<Result<SubscriptionOverviewDto>> AssignAsync(Guid institutionId, AssignSubscriptionCommand command, CancellationToken cancellationToken = default)
    {
        if (context.Current.ExecutionMode != DatabaseExecutionMode.Platform) return Result.Failure<SubscriptionOverviewDto>(Denied());
        var profile = await profiles.GetAsync(institutionId, cancellationToken);
        if (profile.IsFailure) return Result.Failure<SubscriptionOverviewDto>(profile.Error);
        using var scope = context.BeginScope(context.Current with { TenantId = institutionId, ExecutionMode = DatabaseExecutionMode.PlatformCommercial });
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        await db.LockCommercialTenantAsync(institutionId, cancellationToken);
        var plan = await db.PlanVersions.AsNoTracking().SingleOrDefaultAsync(x => x.Id == command.PlanVersionId, cancellationToken);
        if (plan is null) return Result.Failure<SubscriptionOverviewDto>(Error.NotFound("Plan.NotFound", "La versión del plan no existe."));
        if (command.Overrides is null || command.Overrides.Select(x => x.Code).Distinct().Count() != command.Overrides.Length
            || command.Overrides.Any(x => !ProductModuleCatalog.All.Any(m => m.Code == x.Code)))
            return Result.Failure<SubscriptionOverviewDto>(Error.Validation("Subscription.InvalidOverrides", "Revise las excepciones de módulos."));
        var entity = await db.InstitutionSubscriptions.SingleOrDefaultAsync(cancellationToken);
        if ((entity is null && command.Version is not null) || (entity is not null && command.Version != entity.Version))
            return Result.Failure<SubscriptionOverviewDto>(Error.Conflict("Subscription.Modified", "La suscripción cambió. Actualice antes de guardar."));
        var before = await GetCurrentAsync(cancellationToken);
        var isNew = entity is null;
        entity ??= new InstitutionSubscription(institutionId);
        var result = entity.Update(command);
        if (result.IsFailure) return Result.Failure<SubscriptionOverviewDto>(result.Error);
        if (isNew) db.InstitutionSubscriptions.Add(entity);
        // Reemplazo completo bajo el mismo bloqueo; nunca elimina datos académicos.
        await db.SubscriptionModuleOverrides.ExecuteDeleteAsync(cancellationToken);
        db.SubscriptionModuleOverrides.AddRange(command.Overrides.Select(x => new SubscriptionModuleOverride(institutionId, entity.Id, x.Code, x.Enabled)));
        audit.Record(institutionId, "subscription.assigned", entity.Id.ToString(), "Condiciones comerciales actualizadas con motivo explícito.",
            new Dictionary<string, string?> { ["before"] = JsonSerializer.Serialize(before.Subscription), ["after"] = JsonSerializer.Serialize(command) });
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Result.Success(await GetCurrentAsync(cancellationToken));
    }
    public async Task<SubscriptionOverviewDto> GetCurrentAsync(CancellationToken cancellationToken = default)
    {
        if (context.Current.ExecutionMode is not (DatabaseExecutionMode.Tenant or DatabaseExecutionMode.PlatformCommercial) || !context.Current.HasResolvedTenant)
            return Empty();
        var sub = await db.InstitutionSubscriptions.AsNoTracking().SingleOrDefaultAsync(cancellationToken);
        if (sub is null) return Empty();
        var plan = await db.PlanVersions.AsNoTracking().SingleAsync(x => x.Id == sub.PlanVersionId, cancellationToken);
        var overrides = await db.SubscriptionModuleOverrides.AsNoTracking().OrderBy(x => x.Code).Select(x => new ModuleOverrideCommand(x.Code, x.Enabled)).ToArrayAsync(cancellationToken);
        var modules = plan.Modules.ToHashSet(StringComparer.Ordinal);
        foreach (var item in overrides) { if (item.Enabled) modules.Add(item.Code); else modules.Remove(item.Code); }
        var status = sub.EffectiveStatus(DateTimeOffset.UtcNow);
        return new(new(sub.Id, sub.PlanVersionId, sub.StartsAtUtc, sub.EndsAtUtc, sub.Status, sub.Reason, overrides, sub.Version), Map(plan),
            new(status, sub.EndsAtUtc, plan.MaxActiveStudents, plan.MaxSections, ProductModuleCatalog.Resolve(modules, status)));
    }
    private static SubscriptionOverviewDto Empty() => new(null, null, new("Unassigned", null, null, null, ProductModuleCatalog.Resolve([], "Unassigned")));
    private static Error Denied() => Error.Forbidden("Subscription.PlatformRequired", "Requiere administración global.");
    private static PlanVersionDto Map(PlanVersion p) => new(p.Id, p.Code, p.Name, p.Description, p.Revision, p.Price, p.Currency, p.BillingPeriod, p.MaxActiveStudents, p.MaxSections, p.Modules);
}
