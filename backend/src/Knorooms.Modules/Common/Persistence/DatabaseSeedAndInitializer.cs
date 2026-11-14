using Knorooms.Modules.Modules.Authorization.Domain;
using Knorooms.Modules.Modules.Entitlements.Contracts;
using Knorooms.Modules.Modules.Identity.Domain;
using Knorooms.Modules.Modules.Platform.Contracts;
using Knorooms.SharedKernel.Authorization;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Knorooms.Modules.Common.Persistence;

public static class DatabaseSeedAndInitializer
{
    public static async Task MigrateAndSeedCatalogAsync(
        ApplicationDbContext dbContext,
        ITenantContextAccessor tenantContextAccessor,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        await dbContext.Database.MigrateAsync(cancellationToken);

        using var platformScope = tenantContextAccessor.BeginScope(new ExecutionScopeContext(
            TenantHostKind.Platform,
            TenantId: null,
            TenantSlug: null,
            TenantName: null,
            IsTenantSuspended: false,
            UserId: null,
            ExecutionMode: DatabaseExecutionMode.Platform));

        var existingCodes = await dbContext.Permissions
            .AsNoTracking()
            .Select(p => p.Code)
            .ToHashSetAsync(StringComparer.Ordinal, cancellationToken);

        var missing = PermissionCatalog.All
            .Where(def => !existingCodes.Contains(def.Code))
            .Select(PermissionRecord.FromDefinition)
            .ToList();

        if (missing.Count > 0)
        {
            dbContext.Permissions.AddRange(missing);
            await dbContext.SaveChangesAsync(cancellationToken);

            if (logger.IsEnabled(LogLevel.Information))
            {
                logger.LogInformation(
                    "Synchronized {Count} permissions into the central catalog.",
                    missing.Count);
            }
        }
    }

    public static async Task SeedDevelopmentSampleDataAsync(
        ApplicationDbContext dbContext,
        ITenantContextAccessor tenantContextAccessor,
        IPlatformInstitutionService platformService,
        IInstitutionModulesService modulesService,
        string tokenIssuer,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        using var platformScope = tenantContextAccessor.BeginScope(new ExecutionScopeContext(
            TenantHostKind.Platform,
            TenantId: null,
            TenantSlug: null,
            TenantName: null,
            IsTenantSuspended: false,
            UserId: null,
            ExecutionMode: DatabaseExecutionMode.Platform));

        const string adminSubject = "dev-superadmin-sub";
        var admin = await dbContext.Users.SingleOrDefaultAsync(x => x.ExternalSubject == adminSubject, cancellationToken);
        if (admin is null && await dbContext.Institutions.AnyAsync(cancellationToken))
        {
            return;
        }

        admin ??= await GetOrCreateUserAsync(adminSubject, "superadmin@knorooms.local", "Superadministrador KNOROOMS (Dev)", isAdmin: true);
        await GetOrCreateUserAsync("dev-support-sub", "soporte@knorooms.local", "Soporte Técnico KNOROOMS (Dev)", isSupport: true);

        var first = await EnsureSchoolAsync("colegio-a", "Colegio Dominicano A (Piloto)");
        var second = await EnsureSchoolAsync("colegio-b", "Colegio Dominicano B (Piloto)");

        await EnsureRoleAsync(first, await GetOrCreateUserAsync("a0000000-0000-0000-0000-000000000003",
            "direccion@colegio-a.edu.do", "Dirección Colegio A"), SystemRoleCatalog.Principal);
        await EnsureRoleAsync(first, await GetOrCreateUserAsync("a0000000-0000-0000-0000-000000000004",
            "docente@colegio-a.edu.do", "Docente Colegio A"), SystemRoleCatalog.Teacher);
        await EnsureRoleAsync(second, await GetOrCreateUserAsync("a0000000-0000-0000-0000-000000000005",
            "direccion@colegio-b.edu.do", "Dirección Colegio B"), SystemRoleCatalog.Principal);
        await EnsureRoleAsync(first, await GetOrCreateUserAsync("dev-colegio-a-coordinator",
            "coordinacion@colegio-a.edu.do", "Coordinación Colegio A"), SystemRoleCatalog.AcademicCoordinator);
        await EnsureRoleAsync(first, await GetOrCreateUserAsync("dev-colegio-a-registrar",
            "secretaria@colegio-a.edu.do", "Secretaría Colegio A"), SystemRoleCatalog.Registrar);

        logger.LogInformation("Development seed completed with pilot institutions 'colegio-a' and 'colegio-b'.");

        async Task<UserAccount> GetOrCreateUserAsync(string subject, string email, string displayName,
            bool isAdmin = false, bool isSupport = false)
        {
            var existing = await dbContext.Users.SingleOrDefaultAsync(x => x.ExternalSubject == subject, cancellationToken);
            if (existing is not null)
            {
                return existing;
            }

            var user = UserAccount.Create(subject, tokenIssuer, email, displayName, isAdmin, isSupport).Value;
            user.SetPasswordHash(LocalPassword.Hash("Knorooms2026!"));
            dbContext.Users.Add(user);
            await dbContext.SaveChangesAsync(cancellationToken);
            return user;
        }

        async Task<Guid> EnsureSchoolAsync(string slug, string name)
        {
            var id = await dbContext.Institutions.Where(x => x.Slug == slug)
                .Select(x => (Guid?)x.Id).SingleOrDefaultAsync(cancellationToken);
            var schoolId = id ?? (await platformService.CreateInstitutionAsync(
                admin.Id, new CreateInstitutionCommand(slug, name), cancellationToken)).Value.Id;

            var modules = (await modulesService.GetAsync(schoolId, cancellationToken)).Value;
            if (modules.Version is null)
            {
                var enabled = ProductModuleCatalog.All.Where(x => x.Available && x.Code != "moodle")
                    .Select(x => x.Code).ToArray();
                var updated = await modulesService.UpdateAsync(schoolId, new UpdateInstitutionModulesCommand(enabled, null), cancellationToken);
                if (updated.IsFailure)
                {
                    throw new InvalidOperationException(updated.Error.Description);
                }
            }

            return schoolId;
        }

        async Task EnsureRoleAsync(Guid institutionId, UserAccount user, string roleCode)
        {
            using var tenant = tenantContextAccessor.BeginScope(tenantContextAccessor.Current with
            {
                TenantId = institutionId,
                UserId = admin.Id,
                ExecutionMode = DatabaseExecutionMode.PlatformOnboarding
            });

            var role = await dbContext.InstitutionRoles.SingleAsync(x => x.Code == roleCode, cancellationToken);
            var membership = await dbContext.TenantMemberships.Include(x => x.Roles)
                .SingleOrDefaultAsync(x => x.UserId == user.Id, cancellationToken);
            if (membership is null)
            {
                dbContext.TenantMemberships.Add(TenantMembership.Create(institutionId, user.Id, [role]).Value);
            }
            else
            {
                var legacyAdminRoleId = await dbContext.InstitutionRoles
                    .Where(x => x.Code == SystemRoleCatalog.InstitutionAdmin)
                    .Select(x => x.Id).SingleAsync(cancellationToken);
                dbContext.TenantMembershipRoles.RemoveRange(membership.Roles.Where(x => x.RoleId == legacyAdminRoleId));
                membership.AssignRole(role);
            }

            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}
