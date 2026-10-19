using Knorooms.SharedKernel.Domain;
using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.Enrollments.Domain;

public enum EnrollmentStatus
{
    Active = 1,
    Transferred = 2,
    Withdrawn = 3,
    Promoted = 4
}

/// <summary>
/// Matrícula anual de un estudiante en una sección de un año escolar.
/// Un estudiante mantiene un único expediente permanente (StudentRecord) y múltiples matrículas a lo largo de los años.
/// </summary>
public sealed class StudentEnrollment : TenantScopedEntity
{
    public Guid StudentId { get; private set; }

    public Guid AcademicYearId { get; private set; }

    public Guid SectionId { get; private set; }

    public EnrollmentStatus Status { get; private set; } = EnrollmentStatus.Active;

    public DateTimeOffset EnrolledAtUtc { get; private set; }

    private StudentEnrollment()
    {
    }

    public static Result<StudentEnrollment> Create(
        Guid tenantId,
        Guid studentId,
        Guid academicYearId,
        Guid sectionId)
    {
        if (tenantId == Guid.Empty || studentId == Guid.Empty || academicYearId == Guid.Empty || sectionId == Guid.Empty)
        {
            return Result.Failure<StudentEnrollment>(Error.Validation(
                "Enrollment.InvalidIds",
                "TenantId, StudentId, AcademicYearId y SectionId son obligatorios."));
        }

        return Result.Success(new StudentEnrollment
        {
            Id = Guid.CreateVersion7(),
            TenantId = tenantId,
            StudentId = studentId,
            AcademicYearId = academicYearId,
            SectionId = sectionId,
            Status = EnrollmentStatus.Active,
            EnrolledAtUtc = DateTimeOffset.UtcNow
        });
    }

    public Result TransferToSection(Guid targetSectionId)
    {
        if (targetSectionId == Guid.Empty)
        {
            return Result.Failure(Error.Validation(
                "Enrollment.InvalidTargetSection",
                "Debe indicar la sección de destino para el traslado."));
        }

        if (Status != EnrollmentStatus.Active)
        {
            return Result.Failure(Error.Conflict(
                "Enrollment.NotActive",
                "Solo se pueden trasladar de sección matrículas que estén en estado Activo."));
        }

        if (SectionId == targetSectionId)
        {
            return Result.Failure(Error.Conflict(
                "Enrollment.SameSection",
                "El estudiante ya se encuentra matriculado en la sección indicada."));
        }

        SectionId = targetSectionId;
        MarkUpdated();
        return Result.Success();
    }

    public Result Withdraw()
    {
        if (Status == EnrollmentStatus.Withdrawn)
        {
            return Result.Failure(Error.Conflict(
                "Enrollment.AlreadyWithdrawn",
                "La matrícula del estudiante ya figura como retirada."));
        }

        Status = EnrollmentStatus.Withdrawn;
        MarkUpdated();
        return Result.Success();
    }
}
