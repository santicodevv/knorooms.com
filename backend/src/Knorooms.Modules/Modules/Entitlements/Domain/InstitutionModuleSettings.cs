using Knorooms.Modules.Modules.Entitlements.Contracts;
using Knorooms.SharedKernel.Domain;
using Knorooms.SharedKernel.Results;
namespace Knorooms.Modules.Modules.Entitlements.Domain;

public sealed class InstitutionModuleSettings : TenantScopedEntity
{
    private InstitutionModuleSettings() { }
    public InstitutionModuleSettings(Guid tenantId) : base(tenantId) { }
    public string[] EnabledModules { get; private set; } = [];
    public int? MaxActiveStudents { get; private set; }
    public int? MaxSections { get; private set; }
    public uint Version { get; private set; }
    public Result Update(string[] modules)
    {
        if (modules is null || !ProductModuleCatalog.IsValidSelection(modules) || modules.Any(code => !ProductModuleCatalog.All.Any(m => m.Code == code && m.Available)))
            return Result.Failure(Error.Validation("Modules.Invalid", "Revise los módulos disponibles y sus dependencias."));
        EnabledModules = modules.Distinct().Order().ToArray(); MarkUpdated(); return Result.Success();
    }
}
