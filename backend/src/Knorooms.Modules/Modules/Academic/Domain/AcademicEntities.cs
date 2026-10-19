using Knorooms.SharedKernel.Domain;
using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.Academic.Domain;

public enum EducationalStage
{
    EarlyChildhood = 1,
    Primary = 2,
    Secondary = 3
}

public enum SchoolShift
{
    Morning = 1,
    Afternoon = 2,
    FullDay = 3
}

public sealed class AcademicYear : TenantScopedEntity
{
    public string Code { get; private set; } = string.Empty;

    public string Name { get; private set; } = string.Empty;

    public DateOnly StartDate { get; private set; }

    public DateOnly EndDate { get; private set; }

    public bool IsClosed { get; private set; }

    private AcademicYear()
    {
    }

    public static Result<AcademicYear> Create(
        Guid tenantId,
        string code,
        string name,
        DateOnly startDate,
        DateOnly endDate)
    {
        if (tenantId == Guid.Empty)
        {
            return Result.Failure<AcademicYear>(Error.Validation("AcademicYear.InvalidTenant", "TenantId is required."));
        }

        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name))
        {
            return Result.Failure<AcademicYear>(Error.Validation("AcademicYear.InvalidCodeOrName", "Código y nombre del año escolar son obligatorios."));
        }

        if (endDate <= startDate)
        {
            return Result.Failure<AcademicYear>(Error.Validation("AcademicYear.InvalidDateRange", "La fecha de fin debe ser posterior a la fecha de inicio."));
        }

        return Result.Success(new AcademicYear
        {
            Id = Guid.CreateVersion7(),
            TenantId = tenantId,
            Code = code.Trim(),
            Name = name.Trim(),
            StartDate = startDate,
            EndDate = endDate,
            IsClosed = false
        });
    }
}

public sealed class GradeLevel : TenantScopedEntity
{
    public EducationalStage Stage { get; private set; }

    public int OfficialGradeNumber { get; private set; }

    public string Code { get; private set; } = string.Empty;

    public string DisplayName { get; private set; } = string.Empty;

    private GradeLevel()
    {
    }

    public static Result<GradeLevel> Create(
        Guid tenantId,
        EducationalStage stage,
        int officialGradeNumber,
        string code,
        string displayName)
    {
        if (tenantId == Guid.Empty)
        {
            return Result.Failure<GradeLevel>(Error.Validation("GradeLevel.InvalidTenant", "TenantId is required."));
        }

        if (officialGradeNumber is < 1 or > 12)
        {
            return Result.Failure<GradeLevel>(Error.Validation("GradeLevel.InvalidNumber", "El número oficial de grado debe estar entre 1 y 12."));
        }

        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(displayName))
        {
            return Result.Failure<GradeLevel>(Error.Validation("GradeLevel.InvalidName", "Código y etiqueta del grado son obligatorios."));
        }

        return Result.Success(new GradeLevel
        {
            Id = Guid.CreateVersion7(),
            TenantId = tenantId,
            Stage = stage,
            OfficialGradeNumber = officialGradeNumber,
            Code = code.Trim().ToUpperInvariant(),
            DisplayName = displayName.Trim()
        });
    }
}

public sealed class SchoolSection : TenantScopedEntity
{
    public Guid AcademicYearId { get; private set; }

    public Guid GradeLevelId { get; private set; }

    public string Code { get; private set; } = string.Empty;

    public SchoolShift Shift { get; private set; }

    public int Capacity { get; private set; }

    private SchoolSection()
    {
    }

    public static Result<SchoolSection> Create(
        Guid tenantId,
        Guid academicYearId,
        Guid gradeLevelId,
        string code,
        SchoolShift shift,
        int capacity)
    {
        if (tenantId == Guid.Empty || academicYearId == Guid.Empty || gradeLevelId == Guid.Empty)
        {
            return Result.Failure<SchoolSection>(Error.Validation("Section.InvalidIds", "TenantId, AcademicYearId y GradeLevelId son obligatorios."));
        }

        if (string.IsNullOrWhiteSpace(code) || capacity <= 0)
        {
            return Result.Failure<SchoolSection>(Error.Validation("Section.InvalidData", "Código de sección y capacidad positiva son obligatorios."));
        }

        return Result.Success(new SchoolSection
        {
            Id = Guid.CreateVersion7(),
            TenantId = tenantId,
            AcademicYearId = academicYearId,
            GradeLevelId = gradeLevelId,
            Code = code.Trim().ToUpperInvariant(),
            Shift = shift,
            Capacity = capacity
        });
    }
}

public sealed class Subject : TenantScopedEntity
{
    public string Code { get; private set; } = string.Empty;

    public string Name { get; private set; } = string.Empty;

    private Subject()
    {
    }

    public static Result<Subject> Create(Guid tenantId, string code, string name)
    {
        if (tenantId == Guid.Empty || string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name))
        {
            return Result.Failure<Subject>(Error.Validation("Subject.InvalidData", "TenantId, código y nombre de asignatura son obligatorios."));
        }

        return Result.Success(new Subject
        {
            Id = Guid.CreateVersion7(),
            TenantId = tenantId,
            Code = code.Trim().ToUpperInvariant(),
            Name = name.Trim()
        });
    }
}

public sealed class TeacherAssignment : TenantScopedEntity
{
    public Guid AcademicYearId { get; private set; }

    public Guid SectionId { get; private set; }

    public Guid SubjectId { get; private set; }

    public Guid TeacherMembershipId { get; private set; }

    public int WeeklyHours { get; private set; }

    private TeacherAssignment()
    {
    }

    public static Result<TeacherAssignment> Create(
        Guid tenantId,
        Guid academicYearId,
        Guid sectionId,
        Guid subjectId,
        Guid teacherMembershipId,
        int weeklyHours)
    {
        if (tenantId == Guid.Empty || academicYearId == Guid.Empty || sectionId == Guid.Empty ||
            subjectId == Guid.Empty || teacherMembershipId == Guid.Empty || weeklyHours <= 0)
        {
            return Result.Failure<TeacherAssignment>(Error.Validation(
                "TeacherAssignment.InvalidData",
                "Todos los identificadores y las horas semanales positivas son obligatorios."));
        }

        return Result.Success(new TeacherAssignment
        {
            Id = Guid.CreateVersion7(),
            TenantId = tenantId,
            AcademicYearId = academicYearId,
            SectionId = sectionId,
            SubjectId = subjectId,
            TeacherMembershipId = teacherMembershipId,
            WeeklyHours = weeklyHours
        });
    }
}
