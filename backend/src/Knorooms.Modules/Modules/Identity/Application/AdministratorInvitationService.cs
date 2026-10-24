using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Identity.Contracts;
using Knorooms.Modules.Modules.Identity.Domain;
using Knorooms.Modules.Modules.Platform.Domain;
using Knorooms.SharedKernel.Results;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;

namespace Knorooms.Modules.Modules.Identity.Application;

internal sealed class AdministratorInvitationService(ApplicationDbContext db, ITenantContextAccessor context,
    IOptions<InvitationOptions> options, IInvitationEmailSender sender,
    IIdentityAuthPolicyProvider authPolicy, ILogger<AdministratorInvitationService> logger) : IAdministratorInvitationService
{
    public async Task<IReadOnlyList<AdministratorInvitationDto>> ListAsync(CancellationToken cancellationToken = default)
    {
        var rows = await db.AdministratorInvitations.AsNoTracking().OrderByDescending(x => x.CreatedAtUtc)
            .Take(50).ToListAsync(cancellationToken);
        return rows.Select(Map).ToList();
    }

    public async Task<Result<AdministratorInvitationDto>> CreateAsync(string email, CancellationToken cancellationToken = default)
    {
        if (context.Current.ExecutionMode != DatabaseExecutionMode.PlatformOnboarding || context.Current.TenantId is null)
            return Result.Failure<AdministratorInvitationDto>(Error.Forbidden("Invitation.Context", "Se requiere administración autorizada."));
        if (!sender.IsConfigured || !HasValidConfiguration())
            return Result.Failure<AdministratorInvitationDto>(Error.Conflict("Invitation.NotConfigured", "Configure el correo y la clave de invitaciones antes de enviar."));
        var normalized = email.Trim().ToLowerInvariant();
        if (normalized.Length > 320 || !MailAddress.TryCreate(normalized, out var address) || address.Address != normalized)
            return Result.Failure<AdministratorInvitationDto>(Error.Validation("Invitation.Email", "Indique un correo válido."));
        var now = DateTimeOffset.UtcNow;
        var pending = await db.AdministratorInvitations.AsNoTracking().Where(x => x.Email == normalized && x.AcceptedAtUtc == null && x.RevokedAtUtc == null && x.ExpiresAtUtc > now).OrderByDescending(x => x.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);
        if (pending is not null) return Result.Success(Map(pending));
        var id = Guid.CreateVersion7();
        var tenantId = context.Current.TenantId.Value;
        var invitation = AdministratorInvitation.Create(id, tenantId, normalized, Hash(CreateToken(id, tenantId)));
        db.AdministratorInvitations.Add(invitation);
        db.OutboxMessages.Add(OutboxMessage.FromDomainEvent(new AdministratorInvitationQueued(
            Guid.CreateVersion7(), DateTimeOffset.UtcNow, tenantId, id, context.Current.TenantSlug!)));
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success(Map(invitation));
    }

    public async Task<Result> RevokeAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var changed = await db.AdministratorInvitations.Where(x => x.Id == id && x.AcceptedAtUtc == null && x.RevokedAtUtc == null)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.RevokedAtUtc, now), cancellationToken);
        return changed == 1 ? Result.Success() : Result.Failure(Error.Conflict("Invitation.Unavailable", "La invitación no existe o ya fue utilizada/revocada."));
    }

    // Se invoca dentro de la transacción de aceptación. El bloqueo serializa el consumo de la misma invitación.
    public async Task<Result<InvitationIdentityDto>> ValidateIdentityAsync(AcceptAdministratorInvitationCommand command,
        CancellationToken cancellationToken = default)
    {
        var invitation = await db.AdministratorInvitations
            .FromSqlInterpolated($"SELECT * FROM administrator_invitations WHERE id = {command.InvitationId} FOR UPDATE")
            .FirstOrDefaultAsync(cancellationToken);
        if (!IsUsable(invitation, command.Token))
            return Result.Failure<InvitationIdentityDto>(Error.Validation("Invitation.Invalid", "La invitación no es válida, venció o ya fue utilizada."));
        var user = await db.Users.FirstOrDefaultAsync(x => x.Email == invitation!.Email, cancellationToken);
        if (user is not null)
        {
            var policy = authPolicy.Get();
            if (!user.IsActive || user.IsLockedOut(DateTimeOffset.UtcNow))
                return Result.Failure<InvitationIdentityDto>(Error.Forbidden("Invitation.Account", "La cuenta no está disponible. Contacte soporte."));
            if (!user.VerifyPassword(command.Password))
            {
                user.RegisterFailedLoginAttempt(DateTimeOffset.UtcNow, policy.MaxFailedLoginAttempts, policy.LockoutDuration);
                await db.SaveChangesAsync(cancellationToken);
                return Result.Failure<InvitationIdentityDto>(Error.Validation("Invitation.Password", "Si ya tiene cuenta, utilice su contraseña actual."));
            }
            user.ClearLoginFailures(DateTimeOffset.UtcNow);
        }
        else
        {
            if (command.Password.Length is < 12 or > 128 || !command.Password.Any(char.IsUpper)
                || !command.Password.Any(char.IsLower) || !command.Password.Any(char.IsDigit))
                return Result.Failure<InvitationIdentityDto>(Error.Validation("Invitation.Password", "Use entre 12 y 128 caracteres, mayúsculas, minúsculas y números."));
            var id = Guid.CreateVersion7();
            var created = UserAccount.Create(id.ToString(), authPolicy.Get().Issuer, invitation!.Email, command.DisplayName, explicitId: id);
            if (created.IsFailure) return Result.Failure<InvitationIdentityDto>(created.Error);
            user = created.Value;
            user.SetPasswordHash(LocalPassword.Hash(command.Password));
            db.Users.Add(user);
        }
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success(new InvitationIdentityDto(user.Id, user.Email));
    }

    public async Task<Result> ConsumeAsync(Guid id, string token, CancellationToken cancellationToken = default)
    {
        var hash = Hash(token);
        var now = DateTimeOffset.UtcNow;
        var changed = await db.AdministratorInvitations.Where(x => x.Id == id && x.TokenHash == hash
            && x.AcceptedAtUtc == null && x.RevokedAtUtc == null && x.ExpiresAtUtc > now)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.AcceptedAtUtc, now), cancellationToken);
        return changed == 1 ? Result.Success() : Result.Failure(Error.Conflict("Invitation.Consumed", "La invitación ya no está disponible."));
    }

    public async Task DeliverAsync(AdministratorInvitationQueued message, CancellationToken cancellationToken = default)
    {
        using var scope = context.BeginScope(context.Current with
        {
            TenantId = message.TenantId,
            TenantSlug = message.TenantSlug,
            ExecutionMode = DatabaseExecutionMode.PlatformOnboarding
        });
        var invitation = await db.AdministratorInvitations.FirstOrDefaultAsync(x => x.Id == message.InvitationId, cancellationToken);
        if (invitation is null || invitation.AcceptedAtUtc is not null || invitation.RevokedAtUtc is not null
            || invitation.ExpiresAtUtc <= DateTimeOffset.UtcNow || invitation.DeliveryStatus == "Sent") return;
        var deliveryStage = "configuration";
        try
        {
            if (!HasValidConfiguration() || !sender.IsConfigured) throw new InvalidOperationException("Invitation delivery unavailable.");
            deliveryStage = "signature";
            var token = CreateToken(invitation.Id, invitation.TenantId);
            if (!IsUsable(invitation, token)) throw new InvalidOperationException("Invitation key changed.");
            var url = $"{options.Value.Scheme}://{message.TenantSlug}.{options.Value.BaseDomain}/accept-invitation#id={invitation.Id}&token={token}";
            deliveryStage = "transport";
            await sender.SendAsync(invitation.Email, url, cancellationToken);
            deliveryStage = "persistence";
            invitation.SetDeliveryStatus("Sent");
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning("Administrator invitation delivery failed at {DeliveryStage}; failure type {FailureType}; sender {SenderType}.",
                deliveryStage, ex.GetType().Name, sender.GetType().Name);
            invitation.SetDeliveryStatus("Failed");
            await db.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("No se pudo entregar la invitación. Revise la configuración de correo.");
        }
    }

    private bool HasValidConfiguration()
    {
        try
        {
            var settings = options.Value;
            return Convert.FromBase64String(settings.SigningKey).Length == 32
                && !settings.BaseDomain.Contains('/') && !settings.BaseDomain.Contains('@')
                && Uri.TryCreate($"{settings.Scheme}://{settings.BaseDomain}", UriKind.Absolute, out var uri)
                && (uri.Scheme == "https" || (uri.Scheme == "http" && uri.Host == "localhost"));
        }
        catch (FormatException) { return false; }
    }
    private string CreateToken(Guid id, Guid tenantId) => Convert.ToHexString(
        HMACSHA256.HashData(Convert.FromBase64String(options.Value.SigningKey), Encoding.UTF8.GetBytes($"administrator-invitation:{tenantId}:{id}")));
    private static string Hash(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
    private static bool IsUsable(AdministratorInvitation? x, string token) => x is not null
        && x.AcceptedAtUtc is null && x.RevokedAtUtc is null && x.ExpiresAtUtc > DateTimeOffset.UtcNow
        && CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(x.TokenHash), Encoding.ASCII.GetBytes(Hash(token)));
    private static AdministratorInvitationDto Map(AdministratorInvitation x) => new(x.Id, x.Email,
        x.AcceptedAtUtc is not null ? "Accepted" : x.RevokedAtUtc is not null ? "Revoked" :
        x.ExpiresAtUtc <= DateTimeOffset.UtcNow ? "Expired" : "Pending", x.DeliveryStatus, x.ExpiresAtUtc, x.AcceptedAtUtc);
}
