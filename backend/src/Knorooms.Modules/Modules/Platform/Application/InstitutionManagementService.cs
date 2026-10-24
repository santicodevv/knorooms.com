using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Platform.Contracts;
using Knorooms.Modules.Modules.Tenants.Contracts;
using Knorooms.Modules.Modules.Entitlements.Contracts;
using Knorooms.SharedKernel.Results;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;
namespace Knorooms.Modules.Modules.Platform.Application;

internal sealed class InstitutionManagementService(ApplicationDbContext db, ITenantContextAccessor context, IPlatformInstitutionService institutions, IInstitutionProfileService profiles, IInstitutionModulesService modules) : IInstitutionManagementService
{
    public async Task<Result<InstitutionPageDto>> ListAsync(string? search, string? status, string? administrator, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        if (context.Current.ExecutionMode != DatabaseExecutionMode.Platform) return Result.Failure<InstitutionPageDto>(Denied());
        if (page < 1 || pageSize is not (10 or 25 or 50) || (search?.Length ?? 0) > 200 || status is not (null or "" or "Active" or "Suspended") || administrator is not (null or "" or "None" or "Pending" or "Expired" or "Failed" or "Active" or "NotActive"))
            return Result.Failure<InstitutionPageDto>(Error.Validation("Directory.Filters", "Revise los filtros y la paginación."));
        using var scope = context.BeginScope(context.Current with { TenantId = null, ExecutionMode = DatabaseExecutionMode.PlatformDirectory });
        return Result.Success(await InstitutionDirectoryQuery.ReadAsync(db, search, status, administrator, page, pageSize, cancellationToken));
    }
    public async Task<Result<PlatformDashboardDto>> DashboardAsync(CancellationToken cancellationToken = default)
    {
        if (context.Current.ExecutionMode != DatabaseExecutionMode.Platform)
            return Result.Failure<PlatformDashboardDto>(Denied());
        var generatedAt = DateTimeOffset.UtcNow;
        int total, active, without, none, pending, expired, failed;
        List<DashboardMonthDto> growth;
        List<DashboardModuleDto> moduleCounts = [];
        List<RecentInstitutionDto> recent;
        using (context.BeginScope(context.Current with { TenantId = null, ExecutionMode = DatabaseExecutionMode.PlatformDirectory }))
        {
            var query = InstitutionDirectoryQuery.Build(db);
            total = await query.CountAsync(cancellationToken);
            active = await query.CountAsync(x => x.Status == Modules.Tenants.Domain.InstitutionStatus.Active, cancellationToken);
            without = await query.CountAsync(x => x.AdministratorState != "Active", cancellationToken);
            none = await query.CountAsync(x => x.AdministratorState == "None", cancellationToken);
            pending = await query.CountAsync(x => x.AdministratorState == "Pending", cancellationToken);
            expired = await query.CountAsync(x => x.AdministratorState == "Expired", cancellationToken);
            failed = await query.CountAsync(x => x.AdministratorState == "Failed", cancellationToken);
            var registrations = await db.Institutions.AsNoTracking()
                .GroupBy(x => new { x.CreatedAtUtc.Year, x.CreatedAtUtc.Month })
                .Select(g => new { g.Key.Year, g.Key.Month, Count = g.Count() }).ToListAsync(cancellationToken);
            var start = new DateTimeOffset(generatedAt.Year, generatedAt.Month, 1, 0, 0, 0, TimeSpan.Zero).AddMonths(-11);
            growth = Enumerable.Range(0, 12).Select(index => start.AddMonths(index)).Select(month =>
                new DashboardMonthDto(month.Year, month.Month, registrations.Where(g => g.Year < month.Year || (g.Year == month.Year && g.Month <= month.Month)).Sum(g => g.Count))).ToList();
            foreach (var module in ProductModuleCatalog.All.Where(x => x.Available))
                moduleCounts.Add(new(module.Code, module.Name, await db.InstitutionModuleSettings.CountAsync(x => x.EnabledModules.Contains(module.Code), cancellationToken)));
            recent = await db.Institutions.AsNoTracking().OrderByDescending(x => x.CreatedAtUtc).ThenByDescending(x => x.Id).Take(5)
                .Select(x => new RecentInstitutionDto(x.Id, x.Name, x.Slug, x.Status.ToString(), x.CreatedAtUtc)).ToListAsync(cancellationToken);
        }
        // Solo acciones administrativas conocidas; nunca metadatos ni actividad académica.
        string[] allowedActions = ["platform.institution.created", "platform.institution.suspended", "platform.institution.activated", "platform.institution.admin_assigned", "platform.institution.profile_updated", "institution.modules.updated", "platform.invitation.created", "platform.invitation.resent", "platform.invitation.revoked", "platform.invitation.accepted"];
        var activity = await (from entry in db.AuditLogs.AsNoTracking()
            join institution in db.Institutions.AsNoTracking() on entry.TenantId equals (Guid?)institution.Id
            where allowedActions.Contains(entry.Action)
            orderby entry.CreatedAtUtc descending, entry.Id descending
            select new PlatformActivityDto(entry.Id, entry.TenantId, institution.Name, entry.Action, entry.CreatedAtUtc)).Take(5).ToListAsync(cancellationToken);
        return Result.Success(new PlatformDashboardDto(total, active, total - active, without, none, pending, expired, failed, growth, moduleCounts, recent, activity, generatedAt));
    }
    public async Task<Result<bool>> IsSlugAvailableAsync(string slug, CancellationToken cancellationToken = default)
    {
        if (context.Current.ExecutionMode != DatabaseExecutionMode.Platform) return Result.Failure<bool>(Denied());
        if (!HostSubdomainParser.IsValidTenantSlug(slug)) return Result.Success(false);
        return Result.Success(!await db.Institutions.AnyAsync(x => x.Slug == slug, cancellationToken));
    }
    public async Task<Result<InstitutionDto>> CreateAsync(ProvisionInstitutionCommand command, CancellationToken cancellationToken = default)
    {
        if (context.Current.ExecutionMode != DatabaseExecutionMode.Platform || context.Current.UserId is not Guid actorId) return Result.Failure<InstitutionDto>(Denied());
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var created = await institutions.CreateInstitutionAsync(actorId, new(command.Slug, command.Name), cancellationToken);
            if (created.IsFailure) return created;
            var profile = await profiles.GetAsync(created.Value.Id, cancellationToken);
            var updated = await profiles.UpdateAsync(created.Value.Id, actorId, new(command.Name, command.ContactName, command.ContactEmail, command.Phone, command.Address, "", command.LogoUrl, command.TimeZoneId, "", false, "", profile.Value.Version), cancellationToken);
            if (updated.IsFailure) return Result.Failure<InstitutionDto>(updated.Error);
            var enabled = await modules.UpdateAsync(created.Value.Id, new(command.EnabledModules, null), cancellationToken);
            if (enabled.IsFailure) return Result.Failure<InstitutionDto>(enabled.Error);
            await transaction.CommitAsync(cancellationToken);
            return created;
        }
        catch (DbUpdateException ex) when (ex.InnerException is Npgsql.PostgresException { SqlState: "23505" })
        { return Result.Failure<InstitutionDto>(Error.Conflict("Institution.DuplicateSlug", "Este subdominio ya está en uso.")); }
    }
    private static Error Denied() => Error.Forbidden("Institution.PlatformRequired", "Requiere administración global.");
}
