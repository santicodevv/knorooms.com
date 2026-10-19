using System.Text.Json;
using Knorooms.SharedKernel.Domain;

namespace Knorooms.Modules.Modules.Audit.Domain;

/// <summary>
/// Entrada inmutable de bitácora de auditoría para operaciones administrativas y sensibles.
/// Nunca almacena contraseñas, tokens, secretos ni datos personales innecesarios.
/// </summary>
public sealed class AuditLogEntry : Entity
{
    private static readonly string[] ProhibitedKeyFragments =
    [
        "password",
        "secret",
        "token",
        "authorization",
        "cookie",
        "credential",
        "privatekey",
        "api_key",
        "apikey"
    ];

    public Guid? TenantId { get; private set; }

    public Guid? ActorUserId { get; private set; }

    public string ActorAccessType { get; private set; } = "Member";

    public Guid? SupportAccessGrantId { get; private set; }

    public string Action { get; private set; } = string.Empty;

    public string ResourceType { get; private set; } = string.Empty;

    public string ResourceId { get; private set; } = string.Empty;

    public string Summary { get; private set; } = string.Empty;

    public string MetadataJson { get; private set; } = "{}";

    public string? CorrelationId { get; private set; }

    private AuditLogEntry()
    {
    }

    public static AuditLogEntry Create(
        Guid? tenantId,
        Guid? actorUserId,
        string actorAccessType,
        Guid? supportAccessGrantId,
        string action,
        string resourceType,
        string resourceId,
        string summary,
        IReadOnlyDictionary<string, string?>? metadata = null,
        string? correlationId = null)
    {
        var sanitized = new Dictionary<string, string?>(StringComparer.Ordinal);
        if (metadata is not null)
        {
            foreach (var (key, value) in metadata)
            {
                if (IsSensitiveKey(key))
                {
                    sanitized[key] = "[REDACTED]";
                }
                else
                {
                    sanitized[key] = value;
                }
            }
        }

        return new AuditLogEntry
        {
            Id = Guid.CreateVersion7(),
            TenantId = tenantId,
            ActorUserId = actorUserId,
            ActorAccessType = string.IsNullOrWhiteSpace(actorAccessType) ? "System" : actorAccessType.Trim(),
            SupportAccessGrantId = supportAccessGrantId,
            Action = action.Trim(),
            ResourceType = resourceType.Trim(),
            ResourceId = resourceId.Trim(),
            Summary = summary.Trim(),
            MetadataJson = JsonSerializer.Serialize(sanitized),
            CorrelationId = correlationId
        };
    }

    private static bool IsSensitiveKey(string key) =>
        ProhibitedKeyFragments.Any(fragment => key.Contains(fragment, StringComparison.OrdinalIgnoreCase));
}
