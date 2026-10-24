using Knorooms.SharedKernel.Results;
namespace Knorooms.Modules.Modules.Entitlements.Contracts;
public sealed record UpdateInstitutionModulesCommand(string[] EnabledModules, uint? Version);
public sealed record InstitutionModulesDto(string[] EnabledModules, uint? Version, EffectiveAccessDto Access);
public interface IInstitutionModulesService
{
    Task<Result<InstitutionModulesDto>> GetAsync(Guid institutionId, CancellationToken cancellationToken = default);
    Task<Result<InstitutionModulesDto>> UpdateAsync(Guid institutionId, UpdateInstitutionModulesCommand command, CancellationToken cancellationToken = default);
}
