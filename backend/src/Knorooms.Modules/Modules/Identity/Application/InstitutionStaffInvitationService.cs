using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Audit.Domain;
using Knorooms.Modules.Modules.Authorization.Contracts;
using Knorooms.Modules.Modules.Authorization.Domain;
using Knorooms.Modules.Modules.Identity.Contracts;
using Knorooms.Modules.Modules.Identity.Domain;
using Knorooms.Modules.Modules.Platform.Domain;
using Knorooms.SharedKernel.Authorization;
using Knorooms.SharedKernel.Results;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Knorooms.Modules.Modules.Identity.Application;

internal sealed class InstitutionStaffInvitationService : IInstitutionStaffInvitationService
{
    private const int ExpirationHours = 48;

    private readonly ApplicationDbContext _db;
    private readonly ITenantContextAccessor _context;
    private readonly ITenantAuthorizationService _authorization;
    private readonly IOptions<InvitationOptions> _options;
    private readonly IInvitationEmailSender _sender;
    private readonly IIdentityAuthPolicyProvider _authPolicy;
    private readonly ILogger<InstitutionStaffInvitationService> _logger;

    public InstitutionStaffInvitationService(
        ApplicationDbContext db,
        ITenantContextAccessor context,
        ITenantAuthorizationService authorization,
        IOptions<InvitationOptions> options,
        IInvitationEmailSender sender,
        IIdentityAuthPolicyProvider authPolicy,
        ILogger<InstitutionStaffInvitationService> logger)
    {
        _db = db;
        _context = context;
        _authorization = authorization;
        _options = options;
        _sender = sender;
        _authPolicy = authPolicy;
        _logger = logger;
    }

    public async Task<InstitutionStaffInvitationDto> CreateAsync(
        CreateInstitutionStaffInvitationCommand command,
        Guid actorUserId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);

        var tenant = RequireTenant();
        var tenantId = tenant.TenantId!.Value;
        var access = await EnsureManagePermissionAsync(actorUserId, cancellationToken);

        var email = NormalizeEmail(command.Email);
        var now = DateTimeOffset.UtcNow;

        EnsureDeliveryConfiguration();

        var roleIds = command.RoleIds?
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToArray() ?? [];

        if (roleIds.Length == 0)
            throw new InstitutionStaffInvitationException(Error.Validation("Invitation.Roles.Required", "Debe seleccionar al menos un rol."));

        var roles = await _db.InstitutionRoles
            .Include(role => role.Permissions)
            .Where(role => role.TenantId == tenantId && roleIds.Contains(role.Id))
            .ToListAsync(cancellationToken);

        if (roles.Count != roleIds.Length)
            throw new InstitutionStaffInvitationException(Error.Validation("Invitation.Roles.Invalid", "Uno o más roles no pertenecen al colegio actual."));

        var actorPermissions = access.EffectivePermissions;
        var requestedPermissions = roles
            .SelectMany(role => role.Permissions)
            .Select(permission => permission.PermissionCode)
            .Distinct(StringComparer.Ordinal);

        var forbiddenPermission = requestedPermissions
            .FirstOrDefault(permission => !actorPermissions.Contains(permission));

        if (forbiddenPermission is not null)
            throw new InstitutionStaffInvitationException(Error.Forbidden("Invitation.Roles.PermissionDenied", "No puedes asignar un rol que incluya permisos que no tienes."));

        var existingUser = await _db.Users
            .AsNoTracking()
            .AnyAsync(user => user.Email == email && user.IsActive, cancellationToken);

        if (existingUser)
        {
            var existingMembership = await _db.TenantMemberships
                .AnyAsync(membership =>
                    membership.TenantId == tenantId &&
                    membership.UserId == _db.Users
                        .Where(user => user.Email == email)
                        .Select(user => user.Id)
                        .FirstOrDefault() &&
                    membership.Status == MembershipStatus.Active,
                    cancellationToken);

            if (existingMembership)
                throw new InstitutionStaffInvitationException(Error.Conflict("Invitation.Membership.Exists", "Ese usuario ya tiene acceso activo a este colegio."));
        }

        var duplicate = await _db.InstitutionStaffInvitations
            .AnyAsync(invitation =>
                invitation.TenantId == tenantId &&
                invitation.Email == email &&
                invitation.AcceptedAtUtc == null &&
                invitation.RevokedAtUtc == null &&
                invitation.ExpiresAtUtc > now,
                cancellationToken);

        if (duplicate)
            throw new InstitutionStaffInvitationException(Error.Conflict("Invitation.Pending.Exists", "Ya existe una invitación pendiente para ese correo."));

        var invitationId = Guid.CreateVersion7();
        var token = CreateToken(tenantId, invitationId);

        var creation = InstitutionStaffInvitation.Create(
            tenantId,
            email,
            HashToken(token),
            roleIds,
            invitationId,
            now);

        if (creation.IsFailure)
            throw new InstitutionStaffInvitationException(creation.Error);

        var invitation = creation.Value;

        _db.InstitutionStaffInvitations.Add(invitation);
        AddOutboxMessage(tenantId, invitation.Id, tenant.TenantSlug!);

        AddAudit(
            tenantId,
            actorUserId,
            access.AccessType,
            _context.Current.SupportAccessGrantId,
            "institution.staff.invitation.created",
            invitation.Id,
            $"Invitación creada para {email}.");

        await _db.SaveChangesAsync(cancellationToken);

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Staff invitation {InvitationId} created for tenant {TenantId}.",
                invitation.Id,
                tenantId);
        }

        return Map(invitation);
    }

    public async Task<IReadOnlyList<InstitutionStaffInvitationDto>> ListAsync(
        CancellationToken cancellationToken = default)
    {
        var tenant = RequireTenant();
        var tenantId = tenant.TenantId!.Value;

        var invitations = await _db.InstitutionStaffInvitations
            .AsNoTracking()
            .Include(invitation => invitation.Roles)
            .Where(invitation => invitation.TenantId == tenantId)
            .OrderByDescending(invitation => invitation.CreatedAtUtc)
            .Take(50)
            .ToListAsync(cancellationToken);

        return invitations.Select(Map).ToArray();
    }

    public async Task RevokeAsync(
        Guid invitationId,
        Guid actorUserId,
        CancellationToken cancellationToken = default)
    {
        var tenant = RequireTenant();
        var tenantId = tenant.TenantId!.Value;
        var access = await EnsureManagePermissionAsync(actorUserId, cancellationToken);

        var invitation = await _db.InstitutionStaffInvitations
            .SingleOrDefaultAsync(item =>
                item.TenantId == tenantId &&
                item.Id == invitationId,
                cancellationToken);

        if (invitation is null)
            throw new InstitutionStaffInvitationException(Error.NotFound("Invitation.NotFound", "La invitación no existe."));

        var result = invitation.Revoke(DateTimeOffset.UtcNow);

        if (result.IsFailure)
            throw new InstitutionStaffInvitationException(result.Error);

        AddAudit(
            tenantId,
            actorUserId,
            access.AccessType,
            _context.Current.SupportAccessGrantId,
            "institution.staff.invitation.revoked",
            invitation.Id,
            "Invitación revocada.");

        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task ResendAsync(
        Guid invitationId,
        Guid actorUserId,
        CancellationToken cancellationToken = default)
    {
        var tenant = RequireTenant();
        var tenantId = tenant.TenantId!.Value;
        var access = await EnsureManagePermissionAsync(actorUserId, cancellationToken);

        EnsureDeliveryConfiguration();

        var invitation = await _db.InstitutionStaffInvitations
            .SingleOrDefaultAsync(item =>
                item.TenantId == tenantId &&
                item.Id == invitationId,
                cancellationToken);

        if (invitation is null)
            throw new InstitutionStaffInvitationException(Error.NotFound("Invitation.NotFound", "La invitación no existe."));

        var now = DateTimeOffset.UtcNow;

        if (invitation.AcceptedAtUtc is not null ||
            invitation.RevokedAtUtc is not null ||
            invitation.ExpiresAtUtc <= now)
            throw new InstitutionStaffInvitationException(Error.Conflict("Invitation.Resend.Invalid", "La invitación ya no se puede reenviar."));

        invitation.SetDeliveryStatus("Queued");
        AddOutboxMessage(tenantId, invitation.Id, tenant.TenantSlug!);

        AddAudit(
            tenantId,
            actorUserId,
            access.AccessType,
            _context.Current.SupportAccessGrantId,
            "institution.staff.invitation.resent",
            invitation.Id,
            "Se solicitó reenviar la invitación.");

        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeliverAsync(
        InstitutionStaffInvitationQueued message,
        CancellationToken cancellationToken = default)
    {
        using var scope = _context.BeginScope(_context.Current with
        {
            TenantId = message.TenantId,
            TenantSlug = message.TenantSlug,
            ExecutionMode = DatabaseExecutionMode.PlatformOnboarding
        });

        var invitation = await _db.InstitutionStaffInvitations
            .SingleOrDefaultAsync(item =>
                item.TenantId == message.TenantId &&
                item.Id == message.InvitationId,
                cancellationToken);

        if (invitation is null ||
            invitation.AcceptedAtUtc is not null ||
            invitation.RevokedAtUtc is not null ||
            invitation.ExpiresAtUtc <= DateTimeOffset.UtcNow)
            return;

        EnsureDeliveryConfiguration();

        try
        {
            var token = CreateToken(message.TenantId, invitation.Id);
            var url = BuildAcceptanceUrl(message.TenantSlug, invitation.Id, token);

            await _sender.SendAsync(invitation.Email, url, cancellationToken);

            invitation.SetDeliveryStatus("Sent");
            await _db.SaveChangesAsync(cancellationToken);

            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation(
                    "Staff invitation {InvitationId} delivered.",
                    invitation.Id);
            }
        }
        catch (Exception exception)
        {
            invitation.SetDeliveryStatus("Failed");
            await _db.SaveChangesAsync(cancellationToken);

            _logger.LogError(
                "Staff invitation delivery failed. InvitationId={InvitationId}, ErrorType={ErrorType}",
                invitation.Id,
                exception.GetType().Name);

            throw new InvalidOperationException(
                "No se pudo enviar la invitación de personal.");
        }
    }

    public async Task AcceptAsync(
        AcceptInstitutionStaffInvitationCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);

        var current = _context.Current;

        if (current.HostKind != TenantHostKind.Institution ||
            current.TenantId is null ||
            current.IsTenantSuspended)
            throw new InstitutionStaffInvitationException(Error.Forbidden("Invitation.Host.Invalid", "La invitación debe aceptarse desde el portal activo del colegio."));

        using var scope = _context.BeginScope(current with
        {
            ExecutionMode = DatabaseExecutionMode.PlatformOnboarding
        });

        await using var transaction =
            await _db.Database.BeginTransactionAsync(cancellationToken);

        var invitation = await _db.InstitutionStaffInvitations
            .FromSqlInterpolated(
                $"SELECT * FROM institution_staff_invitations WHERE id = {command.InvitationId} FOR UPDATE")
            .Include(item => item.Roles)
            .SingleOrDefaultAsync(cancellationToken);

        if (invitation is null || invitation.TenantId != current.TenantId)
            throw new InstitutionStaffInvitationException(Error.NotFound("Invitation.NotFound", "La invitación no existe."));

        var now = DateTimeOffset.UtcNow;

        if (string.IsNullOrWhiteSpace(command.Token))
            throw new InstitutionStaffInvitationException(Error.Unauthorized("Invitation.Token.Invalid", "El token de invitación no es válido."));

        var expectedHash = HashToken(CreateToken(invitation.TenantId, invitation.Id));
        var suppliedHash = HashToken(command.Token);

        if (!FixedTimeEquals(expectedHash, invitation.TokenHash) ||
            !FixedTimeEquals(suppliedHash, invitation.TokenHash))
            throw new InstitutionStaffInvitationException(Error.Unauthorized("Invitation.Token.Invalid", "El token de invitación no es válido."));

        if (invitation.AcceptedAtUtc is not null ||
            invitation.RevokedAtUtc is not null ||
            invitation.ExpiresAtUtc <= now)
            throw new InstitutionStaffInvitationException(Error.Conflict("Invitation.State.Invalid", "La invitación ya fue utilizada, revocada o ha expirado."));

        var roleIds = invitation.Roles.Select(role => role.RoleId).ToArray();

        var roles = await _db.InstitutionRoles
            .Include(role => role.Permissions)
            .Where(role =>
                role.TenantId == invitation.TenantId &&
                roleIds.Contains(role.Id))
            .ToListAsync(cancellationToken);

        if (roles.Count != roleIds.Length || roles.Count == 0)
            throw new InstitutionStaffInvitationException(Error.Conflict("Invitation.Roles.Unavailable", "Los roles de esta invitación ya no están disponibles."));

        var user = await _db.Users
            .SingleOrDefaultAsync(account => account.Email == invitation.Email,
                cancellationToken);

        if (user is not null)
        {
            if (!user.IsActive)
                throw new InstitutionStaffInvitationException(Error.Forbidden("Invitation.Account.Inactive", "La cuenta asociada a este correo no está activa."));

            if (user.IsLockedOut(now))
                throw new InstitutionStaffInvitationException(Error.Locked("Invitation.Account.Locked", "La cuenta está temporalmente bloqueada."));

            if (!user.VerifyPassword(command.Password))
            {
                var policy = _authPolicy.Get();
                user.RegisterFailedLoginAttempt(
                    now,
                    policy.MaxFailedLoginAttempts,
                    policy.LockoutDuration);

                await _db.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                throw new InstitutionStaffInvitationException(Error.Unauthorized("Invitation.Credentials.Invalid", "Las credenciales no son válidas."));
            }

            user.ClearLoginFailures(now);
        }
        else
        {
            ValidateNewPassword(command.Password);

            if (string.IsNullOrWhiteSpace(command.DisplayName))
                throw new InstitutionStaffInvitationException(Error.Validation("Invitation.DisplayName.Required", "El nombre es obligatorio."));

            var userId = Guid.CreateVersion7();
            var creation = UserAccount.Create(
                userId.ToString(),
                _authPolicy.Get().Issuer,
                invitation.Email,
                command.DisplayName.Trim(),
                explicitId: userId);

            if (creation.IsFailure)
                throw new InstitutionStaffInvitationException(creation.Error);

            user = creation.Value;
            user.SetPasswordHash(LocalPassword.Hash(command.Password));
            _db.Users.Add(user);
        }

        var membership = await _db.TenantMemberships
            .Include(item => item.Roles)
            .SingleOrDefaultAsync(item =>
                item.TenantId == invitation.TenantId &&
                item.UserId == user.Id,
                cancellationToken);

        if (membership is not null)
        {
            if (membership.Status == MembershipStatus.Active)
                throw new InstitutionStaffInvitationException(Error.Conflict("Invitation.Membership.Active", "Este usuario ya tiene acceso activo al colegio."));

            membership.Reactivate();

            var replaceResult = membership.ReplaceRoles(roles);
            if (replaceResult.IsFailure)
                throw new InstitutionStaffInvitationException(replaceResult.Error);
        }
        else
        {
            var membershipResult = TenantMembership.Create(
                invitation.TenantId,
                user.Id,
                roles);

            if (membershipResult.IsFailure)
                throw new InstitutionStaffInvitationException(membershipResult.Error);

            _db.TenantMemberships.Add(membershipResult.Value);
        }

        var acceptResult = invitation.Accept(now);
        if (acceptResult.IsFailure)
            throw new InstitutionStaffInvitationException(acceptResult.Error);

        AddAudit(
            invitation.TenantId,
            user.Id,
            "Institution",
            null,
            "institution.staff.invitation.accepted",
            invitation.Id,
            "Invitación de personal aceptada.");

        await _db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }

    private async Task<ResolvedTenantAccess> EnsureManagePermissionAsync(
        Guid actorUserId,
        CancellationToken cancellationToken)
    {
        if (actorUserId == Guid.Empty)
            throw new InstitutionStaffInvitationException(Error.Unauthorized("Invitation.Actor.Unauthenticated", "El usuario no está autenticado."));

        var access = await _authorization.ResolveUserAccessInCurrentTenantAsync(
            actorUserId,
            false,
            cancellationToken);

        if (!access.HasAccess ||
            !access.EffectivePermissions.Contains(
                PermissionCatalog.InstitutionMembersManage))
            throw new InstitutionStaffInvitationException(Error.Forbidden("Invitation.Permission.Denied", "No tienes permiso para administrar el personal del colegio."));

        return access;
    }

    private ExecutionScopeContext RequireTenant()
    {
        var tenant = _context.Current;

        if (!tenant.HasResolvedTenant ||
            tenant.TenantId is null ||
            tenant.ExecutionMode != DatabaseExecutionMode.Tenant ||
            string.IsNullOrWhiteSpace(tenant.TenantSlug))
            throw new InstitutionStaffInvitationException(Error.Forbidden("Invitation.Tenant.Invalid", "No existe un contexto de colegio válido."));

        return tenant;
    }

    private void AddOutboxMessage(Guid tenantId, Guid invitationId, string tenantSlug)
    {
        _db.OutboxMessages.Add(OutboxMessage.FromDomainEvent(
            new InstitutionStaffInvitationQueued(
                Guid.CreateVersion7(),
                DateTimeOffset.UtcNow,
                tenantId,
                invitationId,
                tenantSlug)));
    }

    private void AddAudit(
        Guid tenantId,
        Guid actorUserId,
        string actorAccessType,
        Guid? supportAccessGrantId,
        string action,
        Guid invitationId,
        string summary)
    {
        _db.AuditLogs.Add(AuditLogEntry.Create(
            tenantId,
            actorUserId,
            actorAccessType,
            supportAccessGrantId,
            action,
            "InstitutionStaffInvitation",
            invitationId.ToString(),
            summary));
    }

    private void EnsureDeliveryConfiguration()
    {
        var key = _options.Value.SigningKey;

        if (string.IsNullOrWhiteSpace(key) ||
            !_sender.IsConfigured ||
            !HasValidConfiguration())
            throw new InvalidOperationException(
                "La configuración de invitaciones o del correo no es válida.");
    }

    private bool HasValidConfiguration()
    {
        try
        {
            var key = Convert.FromBase64String(_options.Value.SigningKey);
            var options = _options.Value;

            return key.Length == 32 &&
                !string.IsNullOrWhiteSpace(options.BaseDomain) &&
                !options.BaseDomain.Contains('/') &&
                !options.BaseDomain.Contains('@') &&
                (options.Scheme == "https" ||
                 (options.Scheme == "http" &&
                  options.BaseDomain.StartsWith("localhost", StringComparison.OrdinalIgnoreCase)));
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private string CreateToken(Guid tenantId, Guid invitationId)
    {
        var key = Convert.FromBase64String(_options.Value.SigningKey);
        var payload = Encoding.UTF8.GetBytes(
            $"institution-staff-invitation:{tenantId}:{invitationId}");

        return Convert.ToHexString(HMACSHA256.HashData(key, payload));
    }

    private static string HashToken(string token)
    {
        return Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes(token)));
    }

    private static bool FixedTimeEquals(string left, string right)
    {
        try
        {
            return CryptographicOperations.FixedTimeEquals(
                Convert.FromHexString(left),
                Convert.FromHexString(right));
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private string BuildAcceptanceUrl(
        string tenantSlug,
        Guid invitationId,
        string token)
    {
        var options = _options.Value;

        return $"{options.Scheme}://{tenantSlug}.{options.BaseDomain}" +
            $"/accept-staff-invitation#id={invitationId}&token={token}";
    }

    private static string NormalizeEmail(string email)
    {
        var normalized = email?.Trim().ToLowerInvariant() ?? string.Empty;

        if (normalized.Length == 0 ||
            normalized.Length > 320 ||
            !MailAddress.TryCreate(normalized, out var parsed) ||
            !string.Equals(parsed.Address, normalized, StringComparison.OrdinalIgnoreCase))
            throw new InstitutionStaffInvitationException(Error.Validation("Invitation.Email.Invalid", "El correo electrónico no es válido."));

        return normalized;
    }

    private static void ValidateNewPassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password) ||
            password.Length < 12 ||
            password.Length > 128 ||
            !password.Any(char.IsUpper) ||
            !password.Any(char.IsLower) ||
            !password.Any(char.IsDigit))
            throw new InstitutionStaffInvitationException(Error.Validation("Invitation.Password.Invalid", "La contraseña debe tener entre 12 y 128 caracteres e incluir mayúsculas, minúsculas y números."));
    }

    private static InstitutionStaffInvitationDto Map(
        InstitutionStaffInvitation invitation)
    {
        return new InstitutionStaffInvitationDto(
            invitation.Id,
            invitation.TenantId,
            invitation.Email,
            invitation.ExpiresAtUtc,
            invitation.AcceptedAtUtc,
            invitation.RevokedAtUtc,
            invitation.DeliveryStatus,
            invitation.Roles.Select(role => role.RoleId).ToArray());
    }
}
