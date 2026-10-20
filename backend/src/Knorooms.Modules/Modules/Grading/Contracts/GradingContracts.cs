using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.Grading.Contracts;

public sealed record GradingWorkspaceOverviewDto(
    Guid? SelectedAcademicYearId,
    string? SelectedAcademicYearName,
    Guid? SelectedSectionId,
    string? SelectedSectionLabel,
    Guid? SelectedSubjectId,
    string? SelectedSubjectName,
    string SelectedPeriodCode,
    IReadOnlyList<EvaluationPolicyVersionDto> Policies,
    EvaluationPolicyVersionDto? ActivePolicy,
    GradingMetricsDto Metrics,
    IReadOnlyList<StudentGradebookRowDto> GradebookRows);

public sealed record EvaluationPolicyVersionDto(
    Guid Id,
    Guid AcademicYearId,
    string AcademicYearName,
    string PolicyCode,
    int VersionNumber,
    string Name,
    string RulesSpecificationJson,
    decimal MinPassingScore,
    IReadOnlyList<string> EnabledPeriods,
    bool IsValidatedWithPilotSchool,
    DateTimeOffset CreatedAtUtc);

public sealed record GradingMetricsDto(
    int TotalStudentsInSection,
    int GradedStudentsCount,
    int ApprovedEntriesCount,
    int PublishedEntriesCount,
    decimal AverageScore,
    int PassingStudentsCount,
    decimal MinPassingScore);

public sealed record StudentGradebookRowDto(
    Guid EnrollmentId,
    Guid StudentId,
    string StudentCode,
    string StudentFullName,
    Guid? GradeEntryId,
    decimal? NumericScore,
    string? Status,
    bool? IsPassing,
    Guid? RecordedByMembershipId,
    string? RecordedByDisplayName,
    Guid? ApprovedByMembershipId,
    string? ApprovedByDisplayName,
    string? CorrectionReason,
    DateTimeOffset? UpdatedAtUtc,
    IReadOnlyDictionary<string, decimal> PeriodScores);

public sealed record CreateEvaluationPolicyCommand(
    Guid AcademicYearId,
    string PolicyCode,
    int VersionNumber,
    string Name,
    decimal MinPassingScore,
    IReadOnlyList<string> EnabledPeriods,
    string? Notes,
    bool IsValidatedWithPilotSchool);

public sealed record StudentGradeInput(
    Guid EnrollmentId,
    decimal NumericScore,
    string? CorrectionReason = null);

public sealed record RecordSectionGradesBatchCommand(
    Guid SectionId,
    Guid SubjectId,
    Guid EvaluationPolicyVersionId,
    string PeriodCode,
    IReadOnlyList<StudentGradeInput> Grades);

public sealed record GradesBatchRecordResultDto(
    Guid SectionId,
    Guid SubjectId,
    string PeriodCode,
    int ProcessedCount,
    int CreatedCount,
    int UpdatedCount);

public sealed record GradeEntryDto(
    Guid Id,
    Guid EnrollmentId,
    Guid SubjectId,
    Guid EvaluationPolicyVersionId,
    string PeriodCode,
    decimal NumericScore,
    string Status,
    Guid RecordedByMembershipId,
    Guid? ApprovedByMembershipId,
    string? CorrectionReason,
    DateTimeOffset UpdatedAtUtc);

public interface IGradingService
{
    Task<GradingWorkspaceOverviewDto> GetGradingWorkspaceOverviewAsync(
        Guid? academicYearId = null,
        Guid? sectionId = null,
        Guid? subjectId = null,
        string? periodCode = null,
        CancellationToken cancellationToken = default);

    Task<Result<EvaluationPolicyVersionDto>> CreateEvaluationPolicyAsync(
        CreateEvaluationPolicyCommand command,
        CancellationToken cancellationToken = default);

    Task<Result<GradesBatchRecordResultDto>> RecordSectionGradesBatchAsync(
        RecordSectionGradesBatchCommand command,
        CancellationToken cancellationToken = default);

    Task<Result<GradeEntryDto>> ApproveGradeEntryAsync(
        Guid gradeEntryId,
        CancellationToken cancellationToken = default);
}
