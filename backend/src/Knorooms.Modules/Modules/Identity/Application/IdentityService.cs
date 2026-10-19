using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Identity.Contracts;
using Knorooms.Modules.Modules.Identity.Domain;
using Knorooms.SharedKernel.Authorization;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace Knorooms.Modules.Modules.Identity.Application;

internal sealed class IdentityService(
    ApplicationDbContext dbContext,
    ITenantContextAccessor tenantContextAccessor) : IIdentityService
{
    public async Task<Guid?> EnsureUserSynchronizedAsync(
        OidcAuthenticatedPrincipal principal,
        CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users
            .FirstOrDefaultAsync(
                u => u.IdentityProviderIssuer == principal.Issuer &&
                     u.ExternalSubject == principal.ExternalSubject,
                cancellationToken);

        if (user is null)
        {
            // Si ya existía por correo (p. ej. seed de desarrollo), vincular el sujeto externo del IdP.
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
            principal.IsPlatformSupport || user.IsPlatformSupport);

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
}
