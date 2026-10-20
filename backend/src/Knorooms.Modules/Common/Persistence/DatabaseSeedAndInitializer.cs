using Knorooms.Modules.Modules.Authorization.Domain;
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
            logger.LogInformation("Synchronized {Count} permissions into the central catalog.", missing.Count);
        }
    }

    public static async Task SeedDevelopmentSampleDataAsync(
        ApplicationDbContext dbContext,
        ITenantContextAccessor tenantContextAccessor,
        IPlatformInstitutionService platformService,
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

        if (await dbContext.Institutions.AnyAsync(cancellationToken))
        {
            return;
        }

        const string developmentPassword = "Knorooms2026!";

        var superAdminResult = UserAccount.Create(
            externalSubject: "dev-superadmin-sub",
            issuer: tokenIssuer,
            email: "superadmin@knorooms.local",
            displayName: "Superadministrador KNOROOMS (Dev)",
            isPlatformAdmin: true,
            isPlatformSupport: false);

        var supportResult = UserAccount.Create(
            externalSubject: "dev-support-sub",
            issuer: tokenIssuer,
            email: "soporte@knorooms.local",
            displayName: "Soporte Técnico KNOROOMS (Dev)",
            isPlatformAdmin: false,
            isPlatformSupport: true);

        var directorAResult = UserAccount.Create(
            externalSubject: "a0000000-0000-0000-0000-000000000003",
            issuer: tokenIssuer,
            email: "direccion@colegio-a.edu.do",
            displayName: "Dirección Colegio A");

        var teacherAResult = UserAccount.Create(
            externalSubject: "a0000000-0000-0000-0000-000000000004",
            issuer: tokenIssuer,
            email: "docente@colegio-a.edu.do",
            displayName: "Docente Colegio A");

        var directorBResult = UserAccount.Create(
            externalSubject: "a0000000-0000-0000-0000-000000000005",
            issuer: tokenIssuer,
            email: "direccion@colegio-b.edu.do",
            displayName: "Dirección Colegio B");

        var seededUsers = new[]
        {
            superAdminResult.Value,
            supportResult.Value,
            directorAResult.Value,
            teacherAResult.Value,
            directorBResult.Value
        };

        foreach (var user in seededUsers)
        {
            user.SetPasswordHash(LocalPassword.Hash(developmentPassword));
        }

        dbContext.Users.AddRange(seededUsers);
        await dbContext.SaveChangesAsync(cancellationToken);

        var colegioA = await platformService.CreateInstitutionAsync(
            superAdminResult.Value.Id,
            new CreateInstitutionCommand("colegio-a", "Colegio Dominicano A (Piloto)"),
            cancellationToken);

        var colegioB = await platformService.CreateInstitutionAsync(
            superAdminResult.Value.Id,
            new CreateInstitutionCommand("colegio-b", "Colegio Dominicano B (Piloto)"),
            cancellationToken);

        if (colegioA.IsSuccess)
        {
            await platformService.AssignInitialAdministratorAsync(
                superAdminResult.Value.Id,
                new AssignInitialAdministratorCommand(colegioA.Value.Id, directorAResult.Value.Email),
                cancellationToken);

            await platformService.AssignInitialAdministratorAsync(
                superAdminResult.Value.Id,
                new AssignInitialAdministratorCommand(colegioA.Value.Id, teacherAResult.Value.Email),
                cancellationToken);
        }

        if (colegioB.IsSuccess)
        {
            await platformService.AssignInitialAdministratorAsync(
                superAdminResult.Value.Id,
                new AssignInitialAdministratorCommand(colegioB.Value.Id, directorBResult.Value.Email),
                cancellationToken);
        }

        logger.LogInformation("Development seed completed with pilot institutions 'colegio-a' and 'colegio-b'.");
    }
}
