using Knorooms.SharedKernel.Results;
using Knorooms.Modules.Modules.Entitlements.Contracts;
namespace Knorooms.Modules.Modules.Subscriptions.Contracts;
public sealed record CreatePlanCommand(string Code, string Name, string Description, int Revision, decimal? Price, string? Currency, string BillingPeriod, int? MaxActiveStudents, int? MaxSections, string[] Modules);
public sealed record PlanVersionDto(Guid Id, string Code, string Name, string Description, int Revision, decimal? Price, string? Currency, string BillingPeriod, int? MaxActiveStudents, int? MaxSections, string[] Modules);
public sealed record ModuleOverrideCommand(string Code, bool Enabled);
public sealed record AssignSubscriptionCommand(Guid PlanVersionId, DateTimeOffset StartsAtUtc, DateTimeOffset EndsAtUtc, string Status, string Reason, ModuleOverrideCommand[] Overrides, uint? Version);
public sealed record SubscriptionDto(Guid Id, Guid PlanVersionId, DateTimeOffset StartsAtUtc, DateTimeOffset EndsAtUtc, string Status, string Reason, ModuleOverrideCommand[] Overrides, uint Version);
public sealed record SubscriptionOverviewDto(SubscriptionDto? Subscription, PlanVersionDto? Plan, EffectiveAccessDto Access);
public interface ISubscriptionService
{
    Task<IReadOnlyList<PlanVersionDto>> ListPlansAsync(CancellationToken cancellationToken = default);
    Task<Result<PlanVersionDto>> CreatePlanAsync(CreatePlanCommand command, CancellationToken cancellationToken = default);
    Task<Result<SubscriptionOverviewDto>> GetAsync(Guid institutionId, CancellationToken cancellationToken = default);
    Task<Result<SubscriptionOverviewDto>> AssignAsync(Guid institutionId, AssignSubscriptionCommand command, CancellationToken cancellationToken = default);
    Task<SubscriptionOverviewDto> GetCurrentAsync(CancellationToken cancellationToken = default);
}
