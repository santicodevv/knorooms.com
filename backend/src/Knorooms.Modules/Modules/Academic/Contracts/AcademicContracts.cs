using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.Academic.Contracts;

public sealed record AcademicYearDto(
    Guid Id,
    string Code,
    string Name,
    DateOnly StartDate,
    DateOnly EndDate,
    bool IsClosed,
    int SectionsCount,
    DateTimeOffset CreatedAtUtc);

public sealed record GradeLevelDto(
    Guid Id,
    string Stage,
    int OfficialGradeNumber,
    string Code,
    string DisplayName,
    int SectionsCount,
    DateTimeOffset CreatedAtUtc);

public sealed record SchoolSectionDto(
    Guid Id,
    Guid AcademicYearId,
    string AcademicYearCode,
    Guid GradeLevelId,
    string GradeLevelCode,
    string GradeLevelName,
    string Code,
    string Shift,
    int Capacity,
    int AssignedSubjectsCount,
    DateTimeOffset CreatedAtUtc);

public sealed record SubjectDto(
    Guid Id,
    string Code,
    string Name,
    int AssignedSectionsCount,
    DateTimeOffset CreatedAtUtc);

public sealed record TeacherAssignmentDto(
    Guid Id,
    Guid AcademicYearId,
    string AcademicYearCode,
    Guid SectionId,
    string SectionCode,
    string GradeLevelName,
    Guid SubjectId,
    string SubjectCode,
    string SubjectName,
    Guid TeacherMembershipId,
    string TeacherDisplayName,
    string TeacherEmail,
    int WeeklyHours,
    DateTimeOffset CreatedAtUtc);

public sealed record AcademicStructureOverviewDto(
    IReadOnlyList<AcademicYearDto> AcademicYears,
    IReadOnlyList<GradeLevelDto> GradeLevels,
    IReadOnlyList<SchoolSectionDto> Sections,
    IReadOnlyList<SubjectDto> Subjects,
    IReadOnlyList<TeacherAssignmentDto> TeacherAssignments);

public sealed record CreateAcademicYearCommand(
    string Code,
    string Name,
    DateOnly StartDate,
    DateOnly EndDate);

public sealed record CreateGradeLevelCommand(
    string Stage,
    int OfficialGradeNumber,
    string Code,
    string DisplayName);

public sealed record CreateSchoolSectionCommand(
    Guid AcademicYearId,
    Guid GradeLevelId,
    string Code,
    string Shift,
    int Capacity);

public sealed record CreateSubjectCommand(
    string Code,
    string Name);

public sealed record AssignTeacherCommand(
    Guid SectionId,
    Guid SubjectId,
    Guid TeacherMembershipId,
    int WeeklyHours);

public interface IAcademicStructureService
{
    Task<AcademicStructureOverviewDto> GetOverviewAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AcademicYearDto>> ListAcademicYearsAsync(
        CancellationToken cancellationToken = default);

    Task<Result<AcademicYearDto>> CreateAcademicYearAsync(
        Guid actorUserId,
        CreateAcademicYearCommand command,
        CancellationToken cancellationToken = default);

    Task<Result> CloseAcademicYearAsync(
        Guid actorUserId,
        Guid academicYearId,
        CancellationToken cancellationToken = default);

    Task<Result> ReopenAcademicYearAsync(
        Guid actorUserId,
        Guid academicYearId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<GradeLevelDto>> ListGradeLevelsAsync(
        CancellationToken cancellationToken = default);

    Task<Result<GradeLevelDto>> CreateGradeLevelAsync(
        Guid actorUserId,
        CreateGradeLevelCommand command,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SchoolSectionDto>> ListSectionsAsync(
        Guid? academicYearId = null,
        Guid? gradeLevelId = null,
        CancellationToken cancellationToken = default);

    Task<Result<SchoolSectionDto>> CreateSectionAsync(
        Guid actorUserId,
        CreateSchoolSectionCommand command,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SubjectDto>> ListSubjectsAsync(
        CancellationToken cancellationToken = default);

    Task<Result<SubjectDto>> CreateSubjectAsync(
        Guid actorUserId,
        CreateSubjectCommand command,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TeacherAssignmentDto>> ListTeacherAssignmentsAsync(
        Guid? academicYearId = null,
        Guid? sectionId = null,
        CancellationToken cancellationToken = default);

    Task<Result<TeacherAssignmentDto>> AssignTeacherAsync(
        Guid actorUserId,
        AssignTeacherCommand command,
        CancellationToken cancellationToken = default);
}
