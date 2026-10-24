using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Audit.Domain;
using Knorooms.Modules.Modules.Tenants.Contracts;
using Knorooms.Modules.Modules.Tenants.Domain;
using Knorooms.SharedKernel.Results;
using Microsoft.EntityFrameworkCore;

namespace Knorooms.Modules.Modules.Tenants.Application;

internal sealed class InstitutionProfileService(ApplicationDbContext db) : IInstitutionProfileService
{
    public async Task<Result<InstitutionProfileDto>> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var institution = await db.Institutions.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        return institution is null
            ? Result.Failure<InstitutionProfileDto>(Error.NotFound("Institution.NotFound", "El colegio no existe."))
            : Result.Success(Map(institution));
    }

    public async Task<Result<InstitutionProfileDto>> UpdateAsync(Guid id, Guid actorUserId,
        UpdateInstitutionProfileCommand command, CancellationToken cancellationToken = default)
    {
        var institution = await db.Institutions.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (institution is null)
            return Result.Failure<InstitutionProfileDto>(Error.NotFound("Institution.NotFound", "El colegio no existe."));
        if (institution.Version != command.Version)
            return Result.Failure<InstitutionProfileDto>(Error.Conflict("Institution.Modified", "La ficha cambió. Actualícela antes de guardar."));
        var result = institution.UpdateProfile(command.Name, command.ContactName, command.ContactEmail,
            command.Phone, command.Address, command.CenterCode, command.LogoUrl, command.TimeZoneId,
            command.OnboardingOwner, command.WelcomeMeetingCompleted, command.OnboardingNotes);
        if (result.IsFailure) return Result.Failure<InstitutionProfileDto>(result.Error);
        db.AuditLogs.Add(AuditLogEntry.Create(id, actorUserId, "PlatformAdmin", null,
            "platform.institution.profile_updated", "Institution", id.ToString(), "Ficha y seguimiento inicial del colegio actualizados."));
        try { await db.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateConcurrencyException)
        {
            return Result.Failure<InstitutionProfileDto>(Error.Conflict("Institution.Modified", "La ficha cambió. Actualícela antes de guardar."));
        }
        return Result.Success(Map(institution));
    }

    private static InstitutionProfileDto Map(Institution x) => new(x.Id, x.Slug, x.Name, x.Status.ToString(),
        x.ContactName, x.ContactEmail, x.Phone, x.Address, x.CenterCode, x.LogoUrl, x.TimeZoneId,
        x.OnboardingOwner, x.WelcomeMeetingCompleted, x.OnboardingNotes, x.Version);
}
