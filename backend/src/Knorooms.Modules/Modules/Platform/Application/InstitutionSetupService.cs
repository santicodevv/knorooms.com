using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Audit.Domain;
using Knorooms.Modules.Modules.Authorization.Contracts;
using Knorooms.Modules.Modules.Identity.Contracts;
using Knorooms.Modules.Modules.Platform.Contracts;
using Knorooms.Modules.Modules.Tenants.Contracts;
using Knorooms.SharedKernel.Authorization;
using Knorooms.SharedKernel.Results;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace Knorooms.Modules.Modules.Platform.Application;

internal sealed class InstitutionSetupService(ApplicationDbContext db, ITenantContextAccessor context,
    IInstitutionProfileService profiles, ITenantAuthorizationService authorization,
    IAdministratorInvitationService invitations, IPlatformInstitutionService institutions) : IInstitutionSetupService
{
    public async Task<Result<InstitutionSetupDto>> GetAsync(Guid institutionId, CancellationToken cancellationToken = default)
    {
        var result = await profiles.GetAsync(institutionId, cancellationToken);
        if (result.IsFailure) return Result.Failure<InstitutionSetupDto>(result.Error);
        var p = result.Value;
        using var scope = BeginOnboarding(p);
        var members = await authorization.ListMembersAsync(cancellationToken);
        var admins = members.Where(x => x.Status == "Active" && x.Roles.Contains(SystemRoleCatalog.InstitutionAdmin))
            .Select(x => new AdministratorSummaryDto(x.UserId, x.DisplayName, x.Email)).ToList();
        var pending = await invitations.ListAsync(cancellationToken);
        SetupTaskDto[] tasks = [
            new("profile", "Completar datos de contacto y dirección", p.ContactName.Length > 0 && p.ContactEmail.Length > 0 && p.Phone.Length > 0 && p.Address.Length > 0),
            new("owner", "Asignar responsable de acompañamiento", p.OnboardingOwner.Length > 0),
            new("administrator", "Activar al administrador del colegio", admins.Count > 0),
            new("welcome", "Realizar reunión inicial", p.WelcomeMeetingCompleted)
        ];
        return Result.Success(new InstitutionSetupDto(p, admins, pending, tasks, tasks.Count(x => x.Completed) * 100 / tasks.Length));
    }
    public async Task<Result<AdministratorInvitationDto>> InviteAsync(Guid institutionId, string email, CancellationToken cancellationToken = default)
    {
        var result = await profiles.GetAsync(institutionId, cancellationToken);
        if (result.IsFailure) return Result.Failure<AdministratorInvitationDto>(result.Error);
        if (result.Value.Status != "Active")
            return Result.Failure<AdministratorInvitationDto>(Error.Conflict("Institution.Suspended", "Reactive el colegio antes de invitar."));
        using var scope = BeginOnboarding(result.Value);
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        await db.LockCommercialTenantAsync(institutionId, cancellationToken);
        var members = await authorization.ListMembersAsync(cancellationToken);
        if (members.Any(x => x.Status == "Active" && x.Roles.Contains(SystemRoleCatalog.InstitutionAdmin) && x.Email.Equals(email.Trim(), StringComparison.OrdinalIgnoreCase)))
            return Result.Failure<AdministratorInvitationDto>(Error.Conflict("Invitation.AlreadyAdministrator", "Esta persona ya administra el colegio."));
        var invitation = await invitations.CreateAsync(email, cancellationToken);
        if (invitation.IsFailure) return invitation;
        Audit(institutionId, "platform.invitation.created", invitation.Value.Id);
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return invitation;
    }
    public async Task<Result> RevokeAsync(Guid institutionId, Guid invitationId, CancellationToken cancellationToken = default)
    {
        var profile = await profiles.GetAsync(institutionId, cancellationToken);
        if (profile.IsFailure) return Result.Failure(profile.Error);
        using var scope = BeginOnboarding(profile.Value);
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var result = await invitations.RevokeAsync(invitationId, cancellationToken);
        if (result.IsFailure) return result;
        Audit(institutionId, "platform.invitation.revoked", invitationId);
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Result.Success();
    }
    public async Task<Result<AdministratorInvitationDto>> ResendAsync(Guid institutionId, Guid invitationId, CancellationToken cancellationToken = default)
    {
        var profile = await profiles.GetAsync(institutionId, cancellationToken);
        if (profile.IsFailure) return Result.Failure<AdministratorInvitationDto>(profile.Error);
        if (profile.Value.Status != "Active") return Result.Failure<AdministratorInvitationDto>(Error.Conflict("Institution.Suspended", "Reactive el colegio antes de invitar."));
        using var scope = BeginOnboarding(profile.Value);
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        await db.LockCommercialTenantAsync(institutionId, cancellationToken);
        var old = await db.AdministratorInvitations.AsNoTracking().SingleOrDefaultAsync(x => x.Id == invitationId, cancellationToken);
        if (old is null || old.AcceptedAtUtc is not null || old.RevokedAtUtc is not null)
            return Result.Failure<AdministratorInvitationDto>(Error.Conflict("Invitation.Unavailable", "La invitación cambió. Actualice su estado antes de reenviar."));
        var revoked = await invitations.RevokeAsync(invitationId, cancellationToken);
        if (revoked.IsFailure) return Result.Failure<AdministratorInvitationDto>(revoked.Error);
        var created = await invitations.CreateAsync(old.Email, cancellationToken);
        if (created.IsFailure) return created;
        Audit(institutionId, "platform.invitation.resent", created.Value.Id);
        await db.SaveChangesAsync(cancellationToken); await transaction.CommitAsync(cancellationToken);
        return created;
    }
    public async Task<Result> AcceptAsync(AcceptAdministratorInvitationCommand command, CancellationToken cancellationToken = default)
    {
        var current = context.Current;
        if (current.HostKind != TenantHostKind.Institution || current.TenantId is null || current.IsTenantSuspended)
            return Result.Failure(Error.Forbidden("Invitation.Host", "Abra la invitación en el portal del colegio."));
        var profile = await profiles.GetAsync(current.TenantId.Value, cancellationToken);
        if (profile.IsFailure) return Result.Failure(profile.Error);
        using var scope = BeginOnboarding(profile.Value);
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var identity = await invitations.ValidateIdentityAsync(command, cancellationToken);
        if (identity.IsFailure)
        {
            // Conserva los intentos fallidos de contraseña, sin consumir la invitación.
            await transaction.CommitAsync(cancellationToken);
            return Result.Failure(identity.Error);
        }
        var consumed = await invitations.ConsumeAsync(command.InvitationId, command.Token, cancellationToken);
        if (consumed.IsFailure) return consumed;
        var assigned = await institutions.AssignInitialAdministratorAsync(identity.Value.UserId,
            new AssignInitialAdministratorCommand(current.TenantId.Value, identity.Value.Email), cancellationToken);
        if (assigned.IsFailure) return Result.Failure(assigned.Error);
        Audit(current.TenantId.Value, "platform.invitation.accepted", command.InvitationId, identity.Value.UserId);
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Result.Success();
    }
    private IDisposable BeginOnboarding(InstitutionProfileDto p) => context.BeginScope(context.Current with
    {
        TenantId = p.Id,
        TenantSlug = p.Slug,
        TenantName = p.Name,
        ExecutionMode = DatabaseExecutionMode.PlatformOnboarding
    });
    private void Audit(Guid tenantId, string action, Guid resourceId, Guid? actorId = null) =>
        db.AuditLogs.Add(AuditLogEntry.Create(tenantId, actorId ?? context.Current.UserId, "Onboarding", null,
            action, "AdministratorInvitation", resourceId.ToString(), "Estado de invitación de administrador actualizado."));
}
