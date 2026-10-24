using Knorooms.Modules.Modules.Entitlements.Contracts;
using Knorooms.Modules.Modules.Students.Domain;
using Knorooms.Modules.Modules.Academic.Domain;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;
namespace Knorooms.Modules.Common.Persistence;

// Invariante de persistencia: también protege servicios invocados por trabajos sin HTTP.
public sealed partial class ApplicationDbContext
{
    public Task LockCommercialTenantAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
        Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({tenantId.ToString()}, 7319))", cancellationToken);

    private string[] ChangedCommercialModules() => ChangeTracker.Entries()
        .Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
        .Select(e => e.Entity.GetType().Namespace?.Split('.').ElementAtOrDefault(3))
        .Select(m => m switch { "Students" => "students", "Academic" => "academic", "Enrollments" => "enrollments", "Attendance" => "attendance", "Grading" => "grading", "ReportCards" => "reportcards", _ => null })
        .Where(m => m is not null).Cast<string>().Distinct().ToArray();

    private async Task ValidateCommercialWritesAsync(string[] modules, CancellationToken cancellationToken)
    {
        if (CurrentExecutionMode != DatabaseExecutionMode.Tenant || CurrentTenantId is not Guid tenantId)
            throw new CommercialAccessException("Entitlement.ContextRequired", "Los cambios académicos requieren contexto institucional.");
        await LockCommercialTenantAsync(tenantId, cancellationToken);
        var direct = await InstitutionModuleSettings.AsNoTracking().SingleOrDefaultAsync(cancellationToken);
        var sub = await InstitutionSubscriptions.AsNoTracking().SingleOrDefaultAsync(cancellationToken);
        var status = sub?.EffectiveStatus(DateTimeOffset.UtcNow) ?? "Unassigned";
        var plan = sub is null ? null : await PlanVersions.AsNoTracking().SingleAsync(x => x.Id == sub.PlanVersionId, cancellationToken);
        var enabled = (plan?.Modules ?? []).ToHashSet(StringComparer.Ordinal);
        foreach (var item in await SubscriptionModuleOverrides.AsNoTracking().ToListAsync(cancellationToken))
        { if (item.Enabled) enabled.Add(item.Code); else enabled.Remove(item.Code); }
        if (direct is not null) { enabled = direct.EnabledModules.ToHashSet(StringComparer.Ordinal); status = "Active"; }
        var access = ProductModuleCatalog.Resolve(enabled, status);
        foreach (var module in modules)
        {
            var feature = access.Single(x => x.Code == module);
            if (!feature.CanWrite) throw new CommercialAccessException("Entitlement.ReadOnly", feature.Reason!);
        }
        // Se cuenta el estado vigente bajo bloqueo y el delta de la unidad de trabajo.
        var studentDelta = ChangeTracker.Entries<StudentRecord>().Sum(e => e.State switch
        {
            EntityState.Added => e.Entity.IsActive ? 1 : 0,
            EntityState.Deleted => e.OriginalValues.GetValue<bool>(nameof(StudentRecord.IsActive)) ? -1 : 0,
            EntityState.Modified => (e.Entity.IsActive ? 1 : 0) - (e.OriginalValues.GetValue<bool>(nameof(StudentRecord.IsActive)) ? 1 : 0),
            _ => 0
        });
        if ((direct is not null ? direct.MaxActiveStudents : plan?.MaxActiveStudents) is int studentsLimit && studentDelta > 0 && await Students.CountAsync(x => x.IsActive, cancellationToken) + studentDelta > studentsLimit)
            throw new CommercialAccessException("Entitlement.StudentLimit", "Se alcanzó el límite de estudiantes activos contratado.");
        var sectionDelta = ChangeTracker.Entries<SchoolSection>().Sum(e => e.State == EntityState.Added ? 1 : e.State == EntityState.Deleted ? -1 : 0);
        if ((direct is not null ? direct.MaxSections : plan?.MaxSections) is int sectionsLimit && sectionDelta > 0 && await SchoolSections.CountAsync(cancellationToken) + sectionDelta > sectionsLimit)
            throw new CommercialAccessException("Entitlement.SectionLimit", "Se alcanzó el límite total de secciones contratado.");
    }
}
