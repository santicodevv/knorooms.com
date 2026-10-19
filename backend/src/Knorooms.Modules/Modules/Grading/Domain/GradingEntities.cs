using Knorooms.SharedKernel.Domain;
using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.Grading.Domain;

public enum GradeWorkflowStatus
{
    Draft = 1,
    Submitted = 2,
    Approved = 3,
    Published = 4
}

/// <summary>
/// Política de evaluación versionada por año escolar y colegio.
/// Permite adaptar esquemas de evaluación sin inventar ni fijar en código reglas normativas del MINERD no validadas.
/// </summary>
public sealed class EvaluationPolicyVersion : TenantScopedEntity
{
    public Guid AcademicYearId { get; private set; }

    public string PolicyCode { get; private set; } = string.Empty;

    public int VersionNumber { get; private set; }

    public string Name { get; private set; } = string.Empty;

    public string RulesSpecificationJson { get; private set; } = "{}";

    public bool IsValidatedWithPilotSchool { get; private set; }

    private EvaluationPolicyVersion()
    {
    }

    public static Result<EvaluationPolicyVersion> Create(
        Guid tenantId,
        Guid academicYearId,
        string policyCode,
        int versionNumber,
        string name,
        string rulesSpecificationJson,
        bool isValidatedWithPilotSchool = false)
    {
        if (tenantId == Guid.Empty || academicYearId == Guid.Empty)
        {
            return Result.Failure<EvaluationPolicyVersion>(Error.Validation("EvaluationPolicy.InvalidIds", "TenantId y AcademicYearId son obligatorios."));
        }

        if (string.IsNullOrWhiteSpace(policyCode) || string.IsNullOrWhiteSpace(name) || versionNumber < 1)
        {
            return Result.Failure<EvaluationPolicyVersion>(Error.Validation("EvaluationPolicy.InvalidMetadata", "Código, nombre y número de versión (>= 1) son obligatorios."));
        }

        return Result.Success(new EvaluationPolicyVersion
        {
            Id = Guid.CreateVersion7(),
            TenantId = tenantId,
            AcademicYearId = academicYearId,
            PolicyCode = policyCode.Trim().ToUpperInvariant(),
            VersionNumber = versionNumber,
            Name = name.Trim(),
            RulesSpecificationJson = string.IsNullOrWhiteSpace(rulesSpecificationJson) ? "{}" : rulesSpecificationJson,
            IsValidatedWithPilotSchool = isValidatedWithPilotSchool
        });
    }
}

/// <summary>
/// Registro de calificación con trazabilidad de autoría, política versionada y motivo de corrección.
/// </summary>
public sealed class GradeEntry : TenantScopedEntity
{
    public Guid EnrollmentId { get; private set; }

    public Guid SubjectId { get; private set; }

    public Guid EvaluationPolicyVersionId { get; private set; }

    public string PeriodCode { get; private set; } = string.Empty;

    public decimal NumericScore { get; private set; }

    public GradeWorkflowStatus Status { get; private set; } = GradeWorkflowStatus.Draft;

    public Guid RecordedByMembershipId { get; private set; }

    public Guid? ApprovedByMembershipId { get; private set; }

    public string? CorrectionReason { get; private set; }

    private GradeEntry()
    {
    }

    public static Result<GradeEntry> RecordDraft(
        Guid tenantId,
        Guid enrollmentId,
        Guid subjectId,
        Guid evaluationPolicyVersionId,
        string periodCode,
        decimal numericScore,
        Guid recordedByMembershipId)
    {
        if (tenantId == Guid.Empty || enrollmentId == Guid.Empty || subjectId == Guid.Empty ||
            evaluationPolicyVersionId == Guid.Empty || recordedByMembershipId == Guid.Empty)
        {
            return Result.Failure<GradeEntry>(Error.Validation("GradeEntry.InvalidIds", "Todos los identificadores de calificación son obligatorios."));
        }

        if (string.IsNullOrWhiteSpace(periodCode))
        {
            return Result.Failure<GradeEntry>(Error.Validation("GradeEntry.InvalidPeriod", "El código de período (p. ej. P1) es obligatorio."));
        }

        if (numericScore is < 0 or > 100)
        {
            return Result.Failure<GradeEntry>(Error.Validation("GradeEntry.InvalidScore", "La calificación debe estar en el rango [0, 100]."));
        }

        return Result.Success(new GradeEntry
        {
            Id = Guid.CreateVersion7(),
            TenantId = tenantId,
            EnrollmentId = enrollmentId,
            SubjectId = subjectId,
            EvaluationPolicyVersionId = evaluationPolicyVersionId,
            PeriodCode = periodCode.Trim().ToUpperInvariant(),
            NumericScore = numericScore,
            Status = GradeWorkflowStatus.Draft,
            RecordedByMembershipId = recordedByMembershipId
        });
    }

    public Result Approve(Guid approverMembershipId)
    {
        if (approverMembershipId == RecordedByMembershipId)
        {
            return Result.Failure(Error.Forbidden(
                "GradeEntry.SeparationOfDutiesViolation",
                "Separación de funciones: quien registra una calificación no puede aprobar su publicación."));
        }

        ApprovedByMembershipId = approverMembershipId;
        Status = GradeWorkflowStatus.Approved;
        MarkUpdated();
        return Result.Success();
    }
}
