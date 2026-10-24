using Knorooms.SharedKernel.Domain;

namespace Knorooms.Modules.Modules.Identity.Domain;

public sealed class AdministratorInvitation : TenantScopedEntity
{
    public string Email { get; private set; } = string.Empty;
    public string TokenHash { get; private set; } = string.Empty;
    public DateTimeOffset ExpiresAtUtc { get; private set; }
    public DateTimeOffset? AcceptedAtUtc { get; private set; }
    public DateTimeOffset? RevokedAtUtc { get; private set; }
    public string DeliveryStatus { get; private set; } = "Queued";
    private AdministratorInvitation() { }
    public static AdministratorInvitation Create(Guid id, Guid tenantId, string email, string tokenHash) =>
        new()
        {
            Id = id,
            TenantId = tenantId,
            Email = email,
            TokenHash = tokenHash,
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddHours(48)
        };
    public void SetDeliveryStatus(string status) { DeliveryStatus = status; MarkUpdated(); }
}
