using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Audit.Contracts;
using Knorooms.Modules.Modules.Audit.Domain;
using Knorooms.SharedKernel.Tenancy;
namespace Knorooms.Modules.Modules.Audit.Application;

internal sealed class AuditWriter(ApplicationDbContext db, ITenantContextAccessor context) : IAuditWriter
{
    public void Record(Guid? tenantId, string action, string resourceId, string summary, IReadOnlyDictionary<string, string?>? metadata = null) =>
        db.AuditLogs.Add(AuditLogEntry.Create(tenantId, context.Current.UserId, context.Current.ExecutionMode.ToString(), context.Current.SupportAccessGrantId,
            action, "Subscription", resourceId, summary, metadata));
}
