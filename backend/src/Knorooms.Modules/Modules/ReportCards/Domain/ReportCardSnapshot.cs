using Knorooms.SharedKernel.Domain;
using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.ReportCards.Domain;

/// <summary>
/// Instantánea histórica inmutable de un boletín de calificaciones publicado.
/// Una vez publicado no se sobrescribe: cualquier rectificación posterior genera una nueva versión auditada.
/// </summary>
public sealed class ReportCardSnapshot : TenantScopedEntity
{
    public Guid EnrollmentId { get; private set; }

    public Guid EvaluationPolicyVersionId { get; private set; }

    public string PeriodCode { get; private set; } = string.Empty;

    public int VersionNumber { get; private set; }

    public string ImmutablePayloadJson { get; private set; } = "{}";

    public Guid PublishedByMembershipId { get; private set; }

    public DateTimeOffset PublishedAtUtc { get; private set; }

    public Guid? SupersedesSnapshotId { get; private set; }

    public string? CorrectionReason { get; private set; }

    private ReportCardSnapshot()
    {
    }

    public static Result<ReportCardSnapshot> PublishInitial(
        Guid tenantId,
        Guid enrollmentId,
        Guid evaluationPolicyVersionId,
        string periodCode,
        string immutablePayloadJson,
        Guid publishedByMembershipId)
    {
        if (tenantId == Guid.Empty || enrollmentId == Guid.Empty ||
            evaluationPolicyVersionId == Guid.Empty || publishedByMembershipId == Guid.Empty)
        {
            return Result.Failure<ReportCardSnapshot>(Error.Validation("ReportCard.InvalidIds", "Todos los identificadores del boletín son obligatorios."));
        }

        if (string.IsNullOrWhiteSpace(periodCode) || string.IsNullOrWhiteSpace(immutablePayloadJson))
        {
            return Result.Failure<ReportCardSnapshot>(Error.Validation("ReportCard.InvalidPayload", "El período y el contenido del boletín son obligatorios."));
        }

        var now = DateTimeOffset.UtcNow;
        return Result.Success(new ReportCardSnapshot
        {
            Id = Guid.CreateVersion7(),
            TenantId = tenantId,
            EnrollmentId = enrollmentId,
            EvaluationPolicyVersionId = evaluationPolicyVersionId,
            PeriodCode = periodCode.Trim().ToUpperInvariant(),
            VersionNumber = 1,
            ImmutablePayloadJson = immutablePayloadJson,
            PublishedByMembershipId = publishedByMembershipId,
            PublishedAtUtc = now,
            CreatedAtUtc = now
        });
    }

    public Result<ReportCardSnapshot> CreateCorrectedVersion(
        string correctedPayloadJson,
        Guid authorizedByMembershipId,
        string correctionReason)
    {
        if (authorizedByMembershipId == Guid.Empty)
        {
            return Result.Failure<ReportCardSnapshot>(Error.Validation("ReportCard.InvalidAuthorizer", "Se requiere la membresía que autoriza la rectificación."));
        }

        if (string.IsNullOrWhiteSpace(correctionReason) || correctionReason.Trim().Length < 10)
        {
            return Result.Failure<ReportCardSnapshot>(Error.Validation(
                "ReportCard.CorrectionReasonRequired",
                "Toda corrección posterior a la publicación de un boletín exige un motivo explícito de al menos 10 caracteres."));
        }

        var now = DateTimeOffset.UtcNow;
        return Result.Success(new ReportCardSnapshot
        {
            Id = Guid.CreateVersion7(),
            TenantId = TenantId,
            EnrollmentId = EnrollmentId,
            EvaluationPolicyVersionId = EvaluationPolicyVersionId,
            PeriodCode = PeriodCode,
            VersionNumber = VersionNumber + 1,
            ImmutablePayloadJson = correctedPayloadJson,
            PublishedByMembershipId = authorizedByMembershipId,
            PublishedAtUtc = now,
            SupersedesSnapshotId = Id,
            CorrectionReason = correctionReason.Trim(),
            CreatedAtUtc = now
        });
    }
}
