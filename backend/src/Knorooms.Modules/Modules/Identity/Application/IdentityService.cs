using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Audit.Domain;
using Knorooms.Modules.Modules.Identity.Contracts;
using Knorooms.Modules.Modules.Identity.Domain;
using Knorooms.SharedKernel.Authorization;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace Knorooms.Modules.Modules.Identity.Application;

internal sealed record IdentityAuthPolicy(
    string Issuer,
    bool EnforceMfaForPrivilegedRoles,
    int MaxFailedLoginAttempts,
    TimeSpan LockoutDuration);

internal interface IIdentityAuthPolicyProvider
{
    IdentityAuthPolicy Get();
}

internal sealed class IdentityService(
    ApplicationDbContext dbContext,
    ITenantContextAccessor tenantContextAccessor,
    ITokenIssuer tokenIssuer,
    IIdentityAuthPolicyProvider authPolicy) : IIdentityService
{
    private const string PlatformIssuerClaim = "urn:knorooms:platform";

    public async Task<Guid?> EnsureUserSynchronizedAsync(
        AuthenticatedPrincipal principal,
        CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users
            .FirstOrDefaultAsync(
                u => u.IdentityProviderIssuer == principal.Issuer &&
                     u.ExternalSubject == principal.ExternalSubject,
                cancellationToken);

        if (user is null)
        {
            // Si ya existía por correo (p. ej. seed de desarrollo), vincular el sujeto del emisor de tokens.
            var normalizedEmail = principal.Email.Trim().ToLowerInvariant();
            user = await dbContext.Users
                .FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);
        }

        if (user is null)
        {
            var createResult = UserAccount.Create(
                principal.ExternalSubject,
                principal.Issuer,
                principal.Email,
                principal.DisplayName,
                principal.IsPlatformAdmin,
                principal.IsPlatformSupport);

            if (createResult.IsFailure)
            {
                return null;
            }

            user = createResult.Value;
            dbContext.Users.Add(user);
            await dbContext.SaveChangesAsync(cancellationToken);
            return user.Id;
        }

        if (!user.IsActive)
        {
            return null;
        }

        // Verifica revocación de sesión posterior a la emisión del token (claim iat).
        if (user.SessionRevokedBeforeUtc.HasValue &&
            principal.IssuedAtUtc.HasValue &&
            principal.IssuedAtUtc.Value < user.SessionRevokedBeforeUtc.Value)
        {
            return null;
        }

        user.SynchronizeFromClaims(
            principal.Email,
            principal.DisplayName,
            principal.IsPlatformAdmin || user.IsPlatformAdmin,
            principal.IsPlatformSupport || user.IsPlatformSupport,
            principal.ExternalSubject,
            principal.Issuer);

        await dbContext.SaveChangesAsync(cancellationToken);
        return user.Id;
    }

    public async Task<CurrentUserProfileDto?> GetCurrentUserProfileAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive, cancellationToken);

        if (user is null)
        {
            return null;
        }

        var currentScope = tenantContextAccessor.Current;
        using var userScope = tenantContextAccessor.BeginScope(currentScope with
        {
            UserId = userId
        });

        var memberships = await (
            from m in dbContext.TenantMemberships.AsNoTracking()
            join i in dbContext.Institutions.AsNoTracking() on m.TenantId equals i.Id
            where m.UserId == userId
            orderby i.Name
            select new UserMembershipSummaryDto(
                m.Id,
                m.TenantId,
                i.Slug,
                i.Name,
                m.Status.ToString()))
            .ToListAsync(cancellationToken);

        var platformRoles = new List<string>();
        if (user.IsPlatformAdmin)
        {
            platformRoles.Add(SystemRoleCatalog.PlatformSuperAdmin);
        }

        if (user.IsPlatformSupport)
        {
            platformRoles.Add(SystemRoleCatalog.PlatformSupportAgent);
        }

        return new CurrentUserProfileDto(
            user.Id,
            user.DisplayName,
            user.Email,
            platformRoles,
            memberships);
    }

    public async Task<IssuedTokensDto?> LoginWithPasswordAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            return null;
        }

        var policy = authPolicy.Get();
        var now = DateTimeOffset.UtcNow;
        var normalizedEmail = email.Trim().ToLowerInvariant();

        using var platformScope = BeginPlatformScope();

        var user = await dbContext.Users
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);

        if (user is null)
        {
            await WriteAuditAsync(
                actorUserId: null,
                action: "auth.login.failed",
                resourceId: normalizedEmail,
                summary: "Intento de inicio de sesión fallido: cuenta inexistente.",
                cancellationToken);
            return null;
        }

        if (!user.IsActive)
        {
            await WriteAuditAsync(
                actorUserId: user.Id,
                action: "auth.login.failed",
                resourceId: user.Id.ToString(),
                summary: "Intento de inicio de sesión fallido: cuenta inactiva.",
                cancellationToken);
            return null;
        }

        if (user.IsLockedOut(now))
        {
            await WriteAuditAsync(
                actorUserId: user.Id,
                action: "auth.login.failed",
                resourceId: user.Id.ToString(),
                summary: "Intento de inicio de sesión fallido: cuenta bloqueada por intentos fallidos.",
                cancellationToken);
            return null;
        }

        // Se evalúa el hash con la contraseña presentada aunque no exista hash local,
        // para no revelar por temporización si la cuenta tiene credencial local.
        var passwordValid = user.VerifyPassword(password);
        if (!passwordValid)
        {
            user.RegisterFailedLoginAttempt(now, policy.MaxFailedLoginAttempts, policy.LockoutDuration);
            await dbContext.SaveChangesAsync(cancellationToken);

            await WriteAuditAsync(
                actorUserId: user.Id,
                action: "auth.login.failed",
                resourceId: user.Id.ToString(),
                summary: "Intento de inicio de sesión fallido: credenciales inválidas.",
                cancellationToken);
            return null;
        }

        user.ClearLoginFailures(now);
        await dbContext.SaveChangesAsync(cancellationToken);

        var issued = await IssueAndPersistTokensAsync(user, policy, now, cancellationToken);

        await WriteAuditAsync(
            actorUserId: user.Id,
            action: "auth.login.succeeded",
            resourceId: user.Id.ToString(),
            summary: "Inicio de sesión exitoso con credencial local.",
            cancellationToken);

        return issued;
    }

    public async Task<IssuedTokensDto?> RefreshTokensAsync(
        string refreshToken,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return null;
        }

        var policy = authPolicy.Get();
        var now = DateTimeOffset.UtcNow;
        var tokenHash = RefreshToken.ComputeTokenHash(refreshToken.Trim());

        using var platformScope = BeginPlatformScope();

        var existing = await dbContext.RefreshTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

        if (existing is null)
        {
            return null;
        }

        // Reutilización de un token ya rotado/revocado: se revocan todos los tokens del usuario.
        if (!existing.IsActiveAt(now))
        {
            await dbContext.RefreshTokens
                .Where(t => t.UserId == existing.UserId && t.RevokedAtUtc == null)
                .ExecuteUpdateAsync(
                    setters => setters.SetProperty(t => t.RevokedAtUtc, now),
                    cancellationToken);
            return null;
        }

        var user = await dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == existing.UserId, cancellationToken);

        if (user is null || !user.IsActive)
        {
            existing.Revoke(now);
            await dbContext.SaveChangesAsync(cancellationToken);
            return null;
        }

        if (user.SessionRevokedBeforeUtc.HasValue &&
            existing.CreatedAtUtc < user.SessionRevokedBeforeUtc.Value)
        {
            existing.Revoke(now);
            await dbContext.SaveChangesAsync(cancellationToken);
            return null;
        }

        var issued = await IssueAndPersistTokensAsync(user, policy, now, cancellationToken);
        var newHash = RefreshToken.ComputeTokenHash(issued.RefreshToken);

        var replacement = await dbContext.RefreshTokens
            .FirstOrDefaultAsync(t => t.TokenHash == newHash, cancellationToken);

        existing.Revoke(now, replacement?.Id);
        await dbContext.SaveChangesAsync(cancellationToken);

        return issued;
    }

    public async Task RevokeRefreshTokenAsync(
        string refreshToken,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return;
        }

        var now = DateTimeOffset.UtcNow;
        var tokenHash = RefreshToken.ComputeTokenHash(refreshToken.Trim());

        using var platformScope = BeginPlatformScope();

        var token = await dbContext.RefreshTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

        if (token is null || token.RevokedAtUtc.HasValue)
        {
            return;
        }

        token.Revoke(now);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task RevokeAllRefreshTokensForUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (userId == Guid.Empty)
        {
            return;
        }

        var now = DateTimeOffset.UtcNow;

        using var platformScope = BeginPlatformScope();

        await dbContext.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAtUtc == null)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(t => t.RevokedAtUtc, now),
                cancellationToken);
    }

    private async Task<IssuedTokensDto> IssueAndPersistTokensAsync(
        UserAccount user,
        IdentityAuthPolicy policy,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var isPrivileged = user.IsPlatformAdmin || user.IsPlatformSupport;
        var hasMultiFactor = !policy.EnforceMfaForPrivilegedRoles || !isPrivileged;

        var accessToken = tokenIssuer.CreateAccessToken(new AccessTokenDescriptor(
            Subject: user.Id,
            Issuer: policy.Issuer,
            Email: user.Email,
            DisplayName: user.DisplayName,
            IsPlatformAdmin: user.IsPlatformAdmin,
            IsPlatformSupport: user.IsPlatformSupport,
            HasMultiFactor: hasMultiFactor,
            IssuedAtUtc: now));

        var refreshTokenValue = tokenIssuer.CreateRefreshTokenValue();
        var refreshResult = RefreshToken.Create(
            user.Id,
            RefreshToken.ComputeTokenHash(refreshTokenValue),
            now,
            TokenLifetime.RefreshTokenLifetime);

        if (refreshResult.IsFailure)
        {
            throw new InvalidOperationException(refreshResult.Error.Description);
        }

        dbContext.RefreshTokens.Add(refreshResult.Value);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new IssuedTokensDto(
            accessToken.Value,
            accessToken.ExpiresAtUtc,
            refreshTokenValue,
            refreshResult.Value.ExpiresAtUtc,
            user.Id,
            user.Email,
            user.DisplayName,
            user.IsPlatformAdmin,
            user.IsPlatformSupport);
    }

    private Task WriteAuditAsync(
        Guid? actorUserId,
        string action,
        string resourceId,
        string summary,
        CancellationToken cancellationToken)
    {
        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: null,
            actorUserId: actorUserId,
            actorAccessType: actorUserId.HasValue ? "Member" : "System",
            supportAccessGrantId: null,
            action: action,
            resourceType: "UserAccount",
            resourceId: resourceId,
            summary: summary));

        return dbContext.SaveChangesAsync(cancellationToken);
    }

    private IDisposable BeginPlatformScope()
    {
        return tenantContextAccessor.BeginScope(new ExecutionScopeContext(
            TenantHostKind.Platform,
            TenantId: null,
            TenantSlug: null,
            TenantName: null,
            IsTenantSuspended: false,
            UserId: null,
            ExecutionMode: DatabaseExecutionMode.Platform));
    }
}
