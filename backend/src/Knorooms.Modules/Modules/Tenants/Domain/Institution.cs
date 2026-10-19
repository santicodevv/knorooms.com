using Knorooms.SharedKernel.Domain;
using Knorooms.SharedKernel.Results;
using Knorooms.SharedKernel.Tenancy;

namespace Knorooms.Modules.Modules.Tenants.Domain;

public enum InstitutionStatus
{
    Active = 1,
    Suspended = 2
}

public enum AcademicProfileType
{
    K12School = 1,
    HigherEducation = 2
}

public sealed record InstitutionCreatedDomainEvent(
    Guid EventId,
    DateTimeOffset OccurredOnUtc,
    Guid InstitutionId,
    string Slug,
    string Name) : IDomainEvent
{
    public Guid? TenantId => InstitutionId;
}

public sealed record InstitutionStatusChangedDomainEvent(
    Guid EventId,
    DateTimeOffset OccurredOnUtc,
    Guid InstitutionId,
    InstitutionStatus NewStatus) : IDomainEvent
{
    public Guid? TenantId => InstitutionId;
}

/// <summary>
/// Representa una institución educativa (colegio o universidad) registrada en KNOROOMS.
/// Su Id actúa como el TenantId canónico en todas las entidades institucionales.
/// </summary>
public sealed class Institution : Entity
{
    public string Slug { get; private set; } = string.Empty;

    public string Name { get; private set; } = string.Empty;

    public InstitutionStatus Status { get; private set; } = InstitutionStatus.Active;

    public AcademicProfileType AcademicProfile { get; private set; } = AcademicProfileType.K12School;

    public string TimeZoneId { get; private set; } = "America/Santo_Domingo";

    public uint Version { get; private set; }

    private Institution()
    {
    }

    public static Result<Institution> Create(
        string slug,
        string name,
        AcademicProfileType academicProfile = AcademicProfileType.K12School,
        Guid? explicitId = null)
    {
        var normalizedSlug = slug?.Trim().ToLowerInvariant() ?? string.Empty;
        if (!HostSubdomainParser.IsValidTenantSlug(normalizedSlug))
        {
            return Result.Failure<Institution>(Error.Validation(
                "Institution.InvalidSlug",
                "El subdominio institucional (slug) debe contener solo letras minúsculas, números o guiones y no usar nombres reservados."));
        }

        var trimmedName = name?.Trim() ?? string.Empty;
        if (trimmedName.Length is < 3 or > 160)
        {
            return Result.Failure<Institution>(Error.Validation(
                "Institution.InvalidName",
                "El nombre de la institución debe tener entre 3 y 160 caracteres."));
        }

        var institution = new Institution
        {
            Id = explicitId ?? Guid.CreateVersion7(),
            Slug = normalizedSlug,
            Name = trimmedName,
            Status = InstitutionStatus.Active,
            AcademicProfile = academicProfile,
            TimeZoneId = "America/Santo_Domingo"
        };

        institution.RaiseDomainEvent(new InstitutionCreatedDomainEvent(
            Guid.CreateVersion7(),
            DateTimeOffset.UtcNow,
            institution.Id,
            institution.Slug,
            institution.Name));

        return Result.Success(institution);
    }

    public Result Suspend()
    {
        if (Status == InstitutionStatus.Suspended)
        {
            return Result.Success();
        }

        Status = InstitutionStatus.Suspended;
        MarkUpdated();
        RaiseDomainEvent(new InstitutionStatusChangedDomainEvent(
            Guid.CreateVersion7(),
            DateTimeOffset.UtcNow,
            Id,
            Status));
        return Result.Success();
    }

    public Result Activate()
    {
        if (Status == InstitutionStatus.Active)
        {
            return Result.Success();
        }

        Status = InstitutionStatus.Active;
        MarkUpdated();
        RaiseDomainEvent(new InstitutionStatusChangedDomainEvent(
            Guid.CreateVersion7(),
            DateTimeOffset.UtcNow,
            Id,
            Status));
        return Result.Success();
    }
}
