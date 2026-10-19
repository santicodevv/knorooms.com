using Knorooms.Modules.Modules.Tenants.Contracts;
using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.Platform.Contracts;

public sealed record CreateInstitutionCommand(
    string Slug,
    string Name);

public sealed record AssignInitialAdministratorCommand(
    Guid InstitutionId,
    string Email);

public sealed record AssignedAdministratorResultDto(
    Guid MembershipId);

public interface IPlatformInstitutionService
{
    Task<IReadOnlyList<InstitutionDto>> ListInstitutionsAsync(
        CancellationToken cancellationToken = default);

    Task<Result<InstitutionDto>> GetInstitutionByIdAsync(
        Guid institutionId,
        CancellationToken cancellationToken = default);

    Task<Result<InstitutionDto>> CreateInstitutionAsync(
        Guid actorUserId,
        CreateInstitutionCommand command,
        CancellationToken cancellationToken = default);

    Task<Result> SuspendInstitutionAsync(
        Guid actorUserId,
        Guid institutionId,
        CancellationToken cancellationToken = default);

    Task<Result> ActivateInstitutionAsync(
        Guid actorUserId,
        Guid institutionId,
        CancellationToken cancellationToken = default);

    Task<Result<AssignedAdministratorResultDto>> AssignInitialAdministratorAsync(
        Guid actorUserId,
        AssignInitialAdministratorCommand command,
        CancellationToken cancellationToken = default);
}
