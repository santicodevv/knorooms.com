using FluentValidation;
using Knorooms.SharedKernel.Tenancy;

namespace Knorooms.Api.Contracts;

public sealed record CreateInstitutionRequest(string Slug, string Name);

public sealed record AssignInstitutionAdministratorRequest(string Email);

public sealed record CreateSupportAccessRequest(
    Guid TenantId,
    string Reason,
    IReadOnlyList<string> Permissions,
    int DurationMinutes = 240);

public sealed class CreateInstitutionRequestValidator : AbstractValidator<CreateInstitutionRequest>
{
    public CreateInstitutionRequestValidator()
    {
        RuleFor(x => x.Slug)
            .NotEmpty().WithMessage("El subdominio (slug) es obligatorio.")
            .MaximumLength(63)
            .Must(HostSubdomainParser.IsValidTenantSlug)
            .WithMessage("El subdominio debe usar minúsculas, números o guiones y no ser un subdominio reservado.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre del colegio es obligatorio.")
            .MinimumLength(3)
            .MaximumLength(160);
    }
}

public sealed class AssignInstitutionAdministratorRequestValidator : AbstractValidator<AssignInstitutionAdministratorRequest>
{
    public AssignInstitutionAdministratorRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("El correo electrónico es obligatorio.")
            .EmailAddress().WithMessage("El formato del correo electrónico no es válido.")
            .MaximumLength(254);
    }
}

public sealed class CreateSupportAccessRequestValidator : AbstractValidator<CreateSupportAccessRequest>
{
    public CreateSupportAccessRequestValidator()
    {
        RuleFor(x => x.TenantId)
            .NotEmpty().WithMessage("Debe indicar la institución (TenantId).");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("El motivo de la solicitud de soporte es obligatorio.")
            .MinimumLength(10)
            .MaximumLength(500);

        RuleFor(x => x.Permissions)
            .NotEmpty().WithMessage("Debe solicitar al menos un permiso institucional.");

        RuleFor(x => x.DurationMinutes)
            .InclusiveBetween(15, 480)
            .WithMessage("La duración del acceso temporal debe estar entre 15 y 480 minutos.");
    }
}

public sealed record CreateAcademicYearRequest(
    string Code,
    string Name,
    DateOnly StartDate,
    DateOnly EndDate);

public sealed record CreateGradeLevelRequest(
    string Stage,
    int OfficialGradeNumber,
    string Code,
    string DisplayName);

public sealed record CreateSchoolSectionRequest(
    Guid AcademicYearId,
    Guid GradeLevelId,
    string Code,
    string Shift,
    int Capacity);

public sealed record CreateSubjectRequest(
    string Code,
    string Name);

public sealed record AssignTeacherRequest(
    Guid SectionId,
    Guid SubjectId,
    Guid TeacherMembershipId,
    int WeeklyHours);

public sealed class CreateAcademicYearRequestValidator : AbstractValidator<CreateAcademicYearRequest>
{
    public CreateAcademicYearRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("El código del año escolar es obligatorio (ej. 2026-2027).")
            .MaximumLength(32);

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre del año escolar es obligatorio.")
            .MinimumLength(3)
            .MaximumLength(120);

        RuleFor(x => x.EndDate)
            .GreaterThan(x => x.StartDate)
            .WithMessage("La fecha de cierre debe ser posterior a la fecha de inicio.");
    }
}

public sealed class CreateGradeLevelRequestValidator : AbstractValidator<CreateGradeLevelRequest>
{
    private static readonly string[] AllowedStages = ["EarlyChildhood", "Primary", "Secondary"];

    public CreateGradeLevelRequestValidator()
    {
        RuleFor(x => x.Stage)
            .NotEmpty().WithMessage("El nivel educativo es obligatorio.")
            .Must(s => AllowedStages.Contains(s, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Nivel inválido. Valores permitidos: EarlyChildhood, Primary, Secondary.");

        RuleFor(x => x.OfficialGradeNumber)
            .InclusiveBetween(1, 12)
            .WithMessage("El número oficial de grado debe estar entre 1 y 12.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("El código del grado es obligatorio (ej. P1, S4).")
            .MaximumLength(32);

        RuleFor(x => x.DisplayName)
            .NotEmpty().WithMessage("El nombre del grado es obligatorio (ej. 1ro de Secundaria).")
            .MinimumLength(3)
            .MaximumLength(120);
    }
}

public sealed class CreateSchoolSectionRequestValidator : AbstractValidator<CreateSchoolSectionRequest>
{
    private static readonly string[] AllowedShifts = ["Morning", "Afternoon", "FullDay"];

    public CreateSchoolSectionRequestValidator()
    {
        RuleFor(x => x.AcademicYearId)
            .NotEmpty().WithMessage("Debe seleccionar un año escolar.");

        RuleFor(x => x.GradeLevelId)
            .NotEmpty().WithMessage("Debe seleccionar un grado académico.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("El código de sección es obligatorio (ej. A, B, 01).")
            .MaximumLength(16);

        RuleFor(x => x.Shift)
            .NotEmpty().WithMessage("La tanda es obligatoria.")
            .Must(s => AllowedShifts.Contains(s, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Tanda inválida. Valores permitidos: Morning, Afternoon, FullDay.");

        RuleFor(x => x.Capacity)
            .InclusiveBetween(1, 120)
            .WithMessage("La capacidad del aula debe estar entre 1 y 120 estudiantes.");
    }
}

public sealed class CreateSubjectRequestValidator : AbstractValidator<CreateSubjectRequest>
{
    public CreateSubjectRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("El código de la asignatura es obligatorio (ej. MAT-101).")
            .MaximumLength(32);

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre de la asignatura es obligatorio.")
            .MinimumLength(3)
            .MaximumLength(120);
    }
}

public sealed class AssignTeacherRequestValidator : AbstractValidator<AssignTeacherRequest>
{
    public AssignTeacherRequestValidator()
    {
        RuleFor(x => x.SectionId)
            .NotEmpty().WithMessage("Debe seleccionar una sección.");

        RuleFor(x => x.SubjectId)
            .NotEmpty().WithMessage("Debe seleccionar una asignatura.");

        RuleFor(x => x.TeacherMembershipId)
            .NotEmpty().WithMessage("Debe seleccionar un docente miembro del colegio.");

        RuleFor(x => x.WeeklyHours)
            .InclusiveBetween(1, 40)
            .WithMessage("Las horas semanales deben estar entre 1 y 40.");
    }
}
