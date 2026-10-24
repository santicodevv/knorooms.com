using Knorooms.SharedKernel.Domain;
using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.Identity.Contracts;

public sealed class InvitationOptions
{
    public const string SectionName = "Invitations";
    public string SigningKey { get; set; } = string.Empty;
    public string BaseDomain { get; set; } = "localhost:3000";
    public string Scheme { get; set; } = "https";
    public string Provider { get; set; } = "Resend";
    public string ResendApiKey { get; set; } = string.Empty;
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public bool SmtpEnableSsl { get; set; } = true;
    public string SmtpUsername { get; set; } = string.Empty;
    public string SmtpPassword { get; set; } = string.Empty;
    public string FromAddress { get; set; } = string.Empty;
}
public sealed record AdministratorInvitationDto(Guid Id, string Email, string Status, string DeliveryStatus,
    DateTimeOffset ExpiresAt, DateTimeOffset? AcceptedAt);
public sealed record AcceptAdministratorInvitationCommand(Guid InvitationId, string Token, string DisplayName, string Password);
public sealed record InvitationIdentityDto(Guid UserId, string Email);
public sealed record AdministratorInvitationQueued(Guid EventId, DateTimeOffset OccurredOnUtc,
    Guid? TenantId, Guid InvitationId, string TenantSlug) : IDomainEvent;

public interface IAdministratorInvitationService
{
    Task<IReadOnlyList<AdministratorInvitationDto>> ListAsync(CancellationToken cancellationToken = default);
    Task<Result<AdministratorInvitationDto>> CreateAsync(string email, CancellationToken cancellationToken = default);
    Task<Result> RevokeAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result<InvitationIdentityDto>> ValidateIdentityAsync(AcceptAdministratorInvitationCommand command, CancellationToken cancellationToken = default);
    Task<Result> ConsumeAsync(Guid id, string token, CancellationToken cancellationToken = default);
    Task DeliverAsync(AdministratorInvitationQueued message, CancellationToken cancellationToken = default);
}
public interface IInvitationEmailSender
{
    bool IsConfigured { get; }
    Task SendAsync(string email, string acceptanceUrl, CancellationToken cancellationToken = default);
}
