using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Audit.Domain;
using Knorooms.Modules.Modules.Authorization.Domain;
using Knorooms.Modules.Modules.Platform.Contracts;
using Knorooms.Modules.Modules.Tenants.Contracts;
using Knorooms.Modules.Modules.Tenants.Domain;
using Knorooms.SharedKernel.Authorization;
using Knorooms.SharedKernel.Results;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace Knorooms.Modules.Modules.Platform.Application;

internal sealed class PlatformInstitutionService(
    ApplicationDbContext dbContext,
    ITenantContextAccessor tenantContextAccessor) : IPlatformInstitutionService
{
    public async Task<IReadOnlyList<InstitutionDto>> ListInstitutionsAsync(
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Institutions
            .AsNoTracking()
            .OrderBy(i => i.Name)
            .Select(i => new InstitutionDto(
                i.Id,
                i.Slug,
                i.Name,
                i.Status.ToString(),
                i.CreatedAtUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<Result<InstitutionDto>> GetInstitutionByIdAsync(
        Guid institutionId,
        CancellationToken cancellationToken = default)
    {
        var institution = await dbContext.Institutions
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == institutionId, cancellationToken);

        if (institution is null)
        {
            return Result.Failure<InstitutionDto>(Error.NotFound(
                "Institution.NotFound",
                "La institución solicitada no existe."));
        }

        return Result.Success(MapToDto(institution));
    }

    public async Task<Result<InstitutionDto>> CreateInstitutionAsync(
        Guid actorUserId,
        CreateInstitutionCommand command,
        CancellationToken cancellationToken = default)
    {
        var createResult = Institution.Create(command.Slug, command.Name);
        if (createResult.IsFailure)
        {
            return Result.Failure<InstitutionDto>(createResult.Error);
        }

        var institution = createResult.Value;
        var slugExists = await dbContext.Institutions
            .AsNoTracking()
            .AnyAsync(i => i.Slug == institution.Slug, cancellationToken);

        if (slugExists)
        {
            return Result.Failure<InstitutionDto>(Error.Conflict(
                "Institution.DuplicateSlug",
                $"Ya existe una institución registrada con el subdominio '{institution.Slug}'."));
        }

        // Abrimos ámbito acotado de alta institucional (PlatformOnboarding) para crear los roles base del nuevo colegio.
        var currentScope = tenantContextAccessor.Current;
        using var onboardingScope = tenantContextAccessor.BeginScope(currentScope with
        {
            TenantId = institution.Id,
            TenantSlug = institution.Slug,
            TenantName = institution.Name,
            UserId = actorUserId,
            ExecutionMode = DatabaseExecutionMode.PlatformOnboarding
        });

        dbContext.Institutions.Add(institution);

        foreach (var (code, template) in SystemRoleCatalog.InstitutionRoleTemplates)
        {
            var roleResult = InstitutionRole.Create(
                institution.Id,
                code,
                template.Name,
                template.Description,
                isSystemRole: true,
                template.Permissions);

            if (roleResult.IsFailure)
            {
                return Result.Failure<InstitutionDto>(roleResult.Error);
            }

            dbContext.InstitutionRoles.Add(roleResult.Value);
        }

        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: institution.Id,
            actorUserId: actorUserId,
            actorAccessType: "PlatformAdmin",
            supportAccessGrantId: null,
            action: "platform.institution.created",
            resourceType: "Institution",
            resourceId: institution.Id.ToString(),
            summary: $"Institución '{institution.Name}' ({institution.Slug}) creada con sus roles base.",
            metadata: new Dictionary<string, string?>
            {
                ["slug"] = institution.Slug,
                ["name"] = institution.Name
            }));

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success(MapToDto(institution));
    }

    public async Task<Result> SuspendInstitutionAsync(
        Guid actorUserId,
        Guid institutionId,
        CancellationToken cancellationToken = default)
    {
        var institution = await dbContext.Institutions
            .FirstOrDefaultAsync(i => i.Id == institutionId, cancellationToken);

        if (institution is null)
        {
            return Result.Failure(Error.NotFound("Institution.NotFound", "La institución solicitada no existe."));
        }

        var result = institution.Suspend();
        if (result.IsFailure)
        {
            return result;
        }

        using var platformScope = tenantContextAccessor.BeginScope(tenantContextAccessor.Current with
        {
            UserId = actorUserId,
            ExecutionMode = DatabaseExecutionMode.Platform
        });

        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: institution.Id,
            actorUserId: actorUserId,
            actorAccessType: "PlatformAdmin",
            supportAccessGrantId: null,
            action: "platform.institution.suspended",
            resourceType: "Institution",
            resourceId: institution.Id.ToString(),
            summary: $"Institución '{institution.Slug}' suspendida."));

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    public async Task<Result> ActivateInstitutionAsync(
        Guid actorUserId,
        Guid institutionId,
        CancellationToken cancellationToken = default)
    {
        var institution = await dbContext.Institutions
            .FirstOrDefaultAsync(i => i.Id == institutionId, cancellationToken);

        if (institution is null)
        {
            return Result.Failure(Error.NotFound("Institution.NotFound", "La institución solicitada no existe."));
        }

        var result = institution.Activate();
        if (result.IsFailure)
        {
            return result;
        }

        using var platformScope = tenantContextAccessor.BeginScope(tenantContextAccessor.Current with
        {
            UserId = actorUserId,
            ExecutionMode = DatabaseExecutionMode.Platform
        });

        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: institution.Id,
            actorUserId: actorUserId,
            actorAccessType: "PlatformAdmin",
            supportAccessGrantId: null,
            action: "platform.institution.activated",
            resourceType: "Institution",
            resourceId: institution.Id.ToString(),
            summary: $"Institución '{institution.Slug}' reactivada."));

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    public async Task<Result<AssignedAdministratorResultDto>> AssignInitialAdministratorAsync(
        Guid actorUserId,
        AssignInitialAdministratorCommand command,
        CancellationToken cancellationToken = default)
    {
        var institution = await dbContext.Institutions
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == command.InstitutionId, cancellationToken);

        if (institution is null)
        {
            return Result.Failure<AssignedAdministratorResultDto>(Error.NotFound(
                "Institution.NotFound",
                "La institución solicitada no existe."));
        }

        var normalizedEmail = command.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        var user = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail && u.IsActive, cancellationToken);

        if (user is null)
        {
            return Result.Failure<AssignedAdministratorResultDto>(Error.NotFound(
                "User.NotFoundByEmail",
                $"No existe un usuario activo con el correo '{normalizedEmail}'. El usuario debe estar registrado en KNOROOMS antes de asignarlo como administrador."));
        }

        var currentScope = tenantContextAccessor.Current;
        using var onboardingScope = tenantContextAccessor.BeginScope(currentScope with
        {
            TenantId = institution.Id,
            TenantSlug = institution.Slug,
            TenantName = institution.Name,
            UserId = actorUserId,
            ExecutionMode = DatabaseExecutionMode.PlatformOnboarding
        });

        var adminRole = await dbContext.InstitutionRoles
            .FirstOrDefaultAsync(
                r => r.TenantId == institution.Id && r.Code == SystemRoleCatalog.InstitutionAdmin,
                cancellationToken);

        if (adminRole is null)
        {
            var template = SystemRoleCatalog.InstitutionRoleTemplates[SystemRoleCatalog.InstitutionAdmin];
            var createdRoleResult = InstitutionRole.Create(
                institution.Id,
                SystemRoleCatalog.InstitutionAdmin,
                template.Name,
                template.Description,
                isSystemRole: true,
                template.Permissions);

            if (createdRoleResult.IsFailure)
            {
                return Result.Failure<AssignedAdministratorResultDto>(createdRoleResult.Error);
            }

            adminRole = createdRoleResult.Value;
            dbContext.InstitutionRoles.Add(adminRole);
        }

        var existingMembership = await dbContext.TenantMemberships
            .Include(m => m.Roles)
            .FirstOrDefaultAsync(
                m => m.TenantId == institution.Id && m.UserId == user.Id,
                cancellationToken);

        TenantMembership targetMembership;
        if (existingMembership is not null)
        {
            existingMembership.Reactivate();
            var assignResult = existingMembership.AssignRole(adminRole);
            if (assignResult.IsFailure)
            {
                return Result.Failure<AssignedAdministratorResultDto>(assignResult.Error);
            }

            targetMembership = existingMembership;
        }
        else
        {
            var membershipResult = TenantMembership.Create(institution.Id, user.Id, [adminRole]);
            if (membershipResult.IsFailure)
            {
                return Result.Failure<AssignedAdministratorResultDto>(membershipResult.Error);
            }

            targetMembership = membershipResult.Value;
            dbContext.TenantMemberships.Add(targetMembership);
        }

        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: institution.Id,
            actorUserId: actorUserId,
            actorAccessType: "PlatformAdmin",
            supportAccessGrantId: null,
            action: "platform.institution.admin_assigned",
            resourceType: "TenantMembership",
            resourceId: targetMembership.Id.ToString(),
            summary: $"Usuario {user.Id} asignado como InstitutionAdmin de '{institution.Slug}'."));

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success(new AssignedAdministratorResultDto(targetMembership.Id));
    }

    private static InstitutionDto MapToDto(Institution institution) =>
        new(
            institution.Id,
            institution.Slug,
            institution.Name,
            institution.Status.ToString(),
            institution.CreatedAtUtc);
}
