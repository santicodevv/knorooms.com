using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.ReportCards.Contracts;

public sealed record ReportCardsOverviewDto(
    Guid? SelectedAcademicYearId,
    string? SelectedAcademicYearName,
    Guid? SelectedSectionId,
    string? SelectedSectionLabel,
    string SelectedPeriodCode,
    Guid? ActiveEvaluationPolicyVersionId,
    string? ActiveEvaluationPolicyName,
    IReadOnlyList<StudentReportCardReadinessDto> StudentReadiness,
    IReadOnlyList<ReportCardSnapshotDto> Snapshots);

public sealed record StudentReportCardReadinessDto(
    Guid EnrollmentId,
    Guid StudentId,
    string StudentCode,
    string StudentFullName,
    string? NationalStudentId,
    int RecordedSubjectsCount,
    int TotalGradeSubjectsCount,
    decimal? PeriodAverageScore,
    int LatestPublishedVersion,
    Guid? LatestSnapshotId,
    DateTimeOffset? LatestPublishedAtUtc);

public sealed record ReportCardSnapshotDto(
    Guid Id,
    Guid EnrollmentId,
    Guid StudentId,
    string StudentCode,
    string StudentFullName,
    string GradeAndSectionLabel,
    string AcademicYearName,
    Guid EvaluationPolicyVersionId,
    string EvaluationPolicyName,
    string PeriodCode,
    int VersionNumber,
    string ImmutablePayloadJson,
    Guid PublishedByMembershipId,
    string PublishedByDisplayName,
    DateTimeOffset PublishedAtUtc,
    Guid? SupersedesSnapshotId,
    string? CorrectionReason);

public sealed record PublishReportCardCommand(
    Guid EnrollmentId,
    Guid EvaluationPolicyVersionId,
    string PeriodCode,
    string? CorrectionReason = null);

public interface IReportCardsService
{
    Task<ReportCardsOverviewDto> GetReportCardsOverviewAsync(
        Guid? academicYearId = null,
        Guid? sectionId = null,
        string? periodCode = null,
        CancellationToken cancellationToken = default);

    Task<Result<ReportCardSnapshotDto>> PublishReportCardAsync(
        PublishReportCardCommand command,
        CancellationToken cancellationToken = default);
}
