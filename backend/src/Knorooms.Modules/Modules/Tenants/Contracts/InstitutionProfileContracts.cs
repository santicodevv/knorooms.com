using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.Tenants.Contracts;

public sealed record InstitutionProfileDto(
    Guid Id, string Slug, string Name, string Status, string ContactName,
    string ContactEmail, string Phone, string Address, string CenterCode,
    string LogoUrl, string TimeZoneId, string OnboardingOwner, bool WelcomeMeetingCompleted,
    string OnboardingNotes, uint Version);

public sealed record UpdateInstitutionProfileCommand(
    string Name, string ContactName, string ContactEmail, string Phone, string Address,
    string CenterCode, string LogoUrl, string TimeZoneId, string OnboardingOwner,
    bool WelcomeMeetingCompleted, string OnboardingNotes, uint Version);

public interface IInstitutionProfileService
{
    Task<Result<InstitutionProfileDto>> GetAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result<InstitutionProfileDto>> UpdateAsync(Guid id, Guid actorUserId,
        UpdateInstitutionProfileCommand command, CancellationToken cancellationToken = default);
}
