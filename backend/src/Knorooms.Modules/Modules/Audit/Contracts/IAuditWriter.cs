namespace Knorooms.Modules.Modules.Audit.Contracts;

public interface IAuditWriter
{
    void Record(Guid? tenantId, string action, string resourceId, string summary, IReadOnlyDictionary<string, string?>? metadata = null);
}
