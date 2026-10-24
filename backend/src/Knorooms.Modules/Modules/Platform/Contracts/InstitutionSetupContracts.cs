using Knorooms.Modules.Modules.Identity.Contracts;
using Knorooms.Modules.Modules.Tenants.Contracts;
using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.Platform.Contracts;

public sealed record AdministratorSummaryDto(Guid UserId, string DisplayName, string Email);
public sealed record SetupTaskDto(string Code, string Label, bool Completed);
public sealed record InstitutionSetupDto(InstitutionProfileDto Profile, IReadOnlyList<AdministratorSummaryDto> Administrators,
    IReadOnlyList<AdministratorInvitationDto> Invitations, IReadOnlyList<SetupTaskDto> Tasks, int ProgressPercent);
public interface IInstitutionSetupService
{
    Task<Result<InstitutionSetupDto>> GetAsync(Guid institutionId, CancellationToken cancellationToken = default);
    Task<Result<AdministratorInvitationDto>> InviteAsync(Guid institutionId, string email, CancellationToken cancellationToken = default);
    Task<Result<AdministratorInvitationDto>> ResendAsync(Guid institutionId, Guid invitationId, CancellationToken cancellationToken = default);
    Task<Result> RevokeAsync(Guid institutionId, Guid invitationId, CancellationToken cancellationToken = default);
    Task<Result> AcceptAsync(AcceptAdministratorInvitationCommand command, CancellationToken cancellationToken = default);
}
