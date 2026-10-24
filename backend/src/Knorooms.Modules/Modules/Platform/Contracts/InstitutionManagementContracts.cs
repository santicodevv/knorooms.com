using Knorooms.Modules.Modules.Tenants.Contracts;
using Knorooms.SharedKernel.Results;
namespace Knorooms.Modules.Modules.Platform.Contracts;

public sealed record ProvisionInstitutionCommand(string Name, string Slug, string ContactEmail, string ContactName, string Phone, string Address, string LogoUrl, string TimeZoneId, string[] EnabledModules);
public sealed record InstitutionListRow(Guid Id, string Name, string Slug, string Status, string ContactEmail, string LogoUrl, string AdministratorState, string? AdministratorEmail, Guid? InvitationId, string[] EnabledModules);
public sealed record InstitutionPageDto(IReadOnlyList<InstitutionListRow> Items, int Total, int Page, int PageSize);
public interface IInstitutionManagementService
{
    Task<Result<PlatformDashboardDto>> DashboardAsync(CancellationToken cancellationToken = default);
    Task<Result<InstitutionPageDto>> ListAsync(string? search, string? status, string? administrator, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<Result<InstitutionDto>> CreateAsync(ProvisionInstitutionCommand command, CancellationToken cancellationToken = default);
    Task<Result<bool>> IsSlugAvailableAsync(string slug, CancellationToken cancellationToken = default);
}

public sealed record DashboardMonthDto(int Year, int Month, int Total);
public sealed record DashboardModuleDto(string Code, string Name, int Count);
public sealed record RecentInstitutionDto(Guid Id, string Name, string Slug, string Status, DateTimeOffset CreatedAt);
public sealed record PlatformActivityDto(Guid Id, Guid? InstitutionId, string InstitutionName, string Action, DateTimeOffset CreatedAt);
public sealed record PlatformDashboardDto(int Total, int Active, int Suspended, int WithoutActiveAdministrator,
    int WithoutAdministrator, int PendingInvitations, int ExpiredInvitations, int FailedInvitations,
    IReadOnlyList<DashboardMonthDto> Growth, IReadOnlyList<DashboardModuleDto> Modules,
    IReadOnlyList<RecentInstitutionDto> RecentInstitutions, IReadOnlyList<PlatformActivityDto> Activity, DateTimeOffset GeneratedAt);
