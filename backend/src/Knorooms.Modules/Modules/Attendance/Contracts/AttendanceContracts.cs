using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.Attendance.Contracts;

public sealed record SectionAttendanceOverviewDto(
    Guid? SelectedAcademicYearId,
    string? SelectedAcademicYearName,
    Guid? SelectedSectionId,
    string? SelectedSectionLabel,
    DateOnly SelectedDate,
    AttendanceDailyMetricsDto Metrics,
    IReadOnlyList<SectionAttendanceRosterItemDto> Roster);

public sealed record AttendanceDailyMetricsDto(
    int TotalEnrolled,
    int RecordedCount,
    int PresentCount,
    int AbsentCount,
    int LateCount,
    int ExcusedCount,
    decimal DailyAttendancePercentage);

public sealed record SectionAttendanceRosterItemDto(
    Guid EnrollmentId,
    Guid StudentId,
    string StudentCode,
    string StudentFullName,
    string? NationalStudentId,
    Guid? AttendanceRecordId,
    string? Status,
    string? JustificationNote,
    Guid? RecordedByMembershipId,
    string? RecordedByDisplayName,
    DateTimeOffset? UpdatedAtUtc,
    StudentAttendanceSummaryDto CumulativeSummary);

public sealed record StudentAttendanceSummaryDto(
    int TotalDaysRecorded,
    int PresentDays,
    int AbsentDays,
    int LateDays,
    int ExcusedDays,
    decimal CumulativeAttendancePercentage);

public sealed record AttendanceEntryInput(
    Guid EnrollmentId,
    string Status,
    string? JustificationNote = null);

public sealed record RecordSectionAttendanceBatchCommand(
    Guid SectionId,
    DateOnly AttendanceDate,
    IReadOnlyList<AttendanceEntryInput> Entries);

public sealed record AttendanceBatchRecordResultDto(
    Guid SectionId,
    DateOnly AttendanceDate,
    int ProcessedCount,
    int CreatedCount,
    int UpdatedCount);

public interface IAttendanceService
{
    Task<SectionAttendanceOverviewDto> GetSectionAttendanceOverviewAsync(
        Guid? academicYearId = null,
        Guid? sectionId = null,
        DateOnly? attendanceDate = null,
        CancellationToken cancellationToken = default);

    Task<Result<AttendanceBatchRecordResultDto>> RecordSectionAttendanceBatchAsync(
        RecordSectionAttendanceBatchCommand command,
        CancellationToken cancellationToken = default);
}
