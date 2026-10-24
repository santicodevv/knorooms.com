using Knorooms.SharedKernel.Domain;
using Knorooms.SharedKernel.Results;
using Knorooms.Modules.Modules.Subscriptions.Contracts;
using Knorooms.Modules.Modules.Entitlements.Contracts;
namespace Knorooms.Modules.Modules.Subscriptions.Domain;
public sealed class PlanVersion : Entity
{
    private PlanVersion() { }
    public string Code { get; private set; } = "";
    public string Name { get; private set; } = "";
    public string Description { get; private set; } = "";
    public int Revision { get; private set; }
    public decimal? Price { get; private set; }
    public string? Currency { get; private set; }
    public string BillingPeriod { get; private set; } = "";
    public int? MaxActiveStudents { get; private set; }
    public int? MaxSections { get; private set; }
    public string[] Modules { get; private set; } = [];
    public static Result<PlanVersion> Create(CreatePlanCommand c)
    {
        if (string.IsNullOrWhiteSpace(c.Code) || c.Code.Length > 40 || string.IsNullOrWhiteSpace(c.Name) || c.Name.Length > 120
            || c.Description is null || c.Description.Length > 2000 || c.Revision < 1 || c.Price < 0
            || (c.Price.HasValue && (c.Currency is null || !System.Text.RegularExpressions.Regex.IsMatch(c.Currency, "^[A-Z]{3}$")))
            || c.BillingPeriod is not ("Monthly" or "Annual" or "Custom") || c.MaxActiveStudents < 1 || c.MaxSections < 1
            || c.Modules is null || !ProductModuleCatalog.IsValidSelection(c.Modules))
            return Result.Failure<PlanVersion>(Error.Validation("Plan.Invalid", "Revise los datos, límites y dependencias del plan."));
        return Result.Success(new PlanVersion { Code = c.Code.Trim().ToUpperInvariant(), Name = c.Name.Trim(), Description = c.Description.Trim(),
            Revision = c.Revision, Price = c.Price, Currency = c.Price.HasValue ? c.Currency : null, BillingPeriod = c.BillingPeriod,
            MaxActiveStudents = c.MaxActiveStudents, MaxSections = c.MaxSections, Modules = c.Modules.Distinct().Order().ToArray() });
    }
}
public sealed class InstitutionSubscription : TenantScopedEntity
{
    private InstitutionSubscription() { }
    public InstitutionSubscription(Guid tenantId) : base(tenantId) { }
    public Guid PlanVersionId { get; private set; }
    public DateTimeOffset StartsAtUtc { get; private set; }
    public DateTimeOffset EndsAtUtc { get; private set; }
    public string Status { get; private set; } = "Active";
    public string Reason { get; private set; } = "";
    public uint Version { get; private set; }
    public Result Update(AssignSubscriptionCommand c)
    {
        if (c.PlanVersionId == Guid.Empty || c.EndsAtUtc <= c.StartsAtUtc || c.Status is not ("Active" or "Suspended" or "Cancelled")
            || string.IsNullOrWhiteSpace(c.Reason) || c.Reason.Length > 1000)
            return Result.Failure(Error.Validation("Subscription.Invalid", "Indique vigencia válida, estado y motivo del cambio."));
        PlanVersionId = c.PlanVersionId; StartsAtUtc = c.StartsAtUtc.ToUniversalTime(); EndsAtUtc = c.EndsAtUtc.ToUniversalTime();
        Status = c.Status; Reason = c.Reason.Trim(); MarkUpdated(); return Result.Success();
    }
    public string EffectiveStatus(DateTimeOffset now) => Status != "Active" ? Status : now < StartsAtUtc ? "Scheduled" : now >= EndsAtUtc ? "Expired" : "Active";
}
public sealed class SubscriptionModuleOverride : TenantScopedEntity
{
    private SubscriptionModuleOverride() { }
    public SubscriptionModuleOverride(Guid tenantId, Guid subscriptionId, string code, bool enabled) : base(tenantId)
    { SubscriptionId = subscriptionId; Code = code; Enabled = enabled; }
    public Guid SubscriptionId { get; private set; }
    public string Code { get; private set; } = "";
    public bool Enabled { get; private set; }
}
