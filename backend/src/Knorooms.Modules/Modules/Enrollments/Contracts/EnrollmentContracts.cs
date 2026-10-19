using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.Enrollments.Contracts;

public sealed record SectionCapacitySnapshotDto(
    Guid SectionId,
    Guid AcademicYearId,
    string AcademicYearCode,
    bool IsAcademicYearClosed,
    Guid GradeLevelId,
    string GradeLevelCode,
    string GradeLevelName,
    string SectionCode,
    string Shift,
    int Capacity,
    int ActiveEnrollmentsCount,
    int AvailableSeats);

public sealed record StudentEnrollmentDto(
    Guid Id,
    Guid StudentId,
    string StudentCode,
    string StudentFullName,
    string? SigerdExternalId,
    Guid AcademicYearId,
    string AcademicYearCode,
    Guid SectionId,
    string SectionCode,
    string GradeLevelCode,
    string GradeLevelName,
    string Shift,
    string Status,
    DateTimeOffset EnrolledAtUtc);

public sealed record EnrollmentsOverviewDto(
    IReadOnlyList<StudentEnrollmentDto> Enrollments,
    IReadOnlyList<SectionCapacitySnapshotDto> SectionCapacities);

public sealed record EnrollStudentCommand(
    Guid StudentId,
    Guid SectionId);

public sealed record TransferStudentSectionCommand(
    Guid EnrollmentId,
    Guid TargetSectionId);

public interface IStudentEnrollmentService
{
    Task<EnrollmentsOverviewDto> GetOverviewAsync(
        Guid? academicYearId = null,
        Guid? sectionId = null,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<StudentEnrollmentDto>> ListEnrollmentsAsync(
        Guid? academicYearId = null,
        Guid? sectionId = null,
        CancellationToken cancellationToken = default);

    Task<Result<StudentEnrollmentDto>> EnrollStudentAsync(
        Guid actorUserId,
        EnrollStudentCommand command,
        CancellationToken cancellationToken = default);

    Task<Result<StudentEnrollmentDto>> TransferSectionAsync(
        Guid actorUserId,
        TransferStudentSectionCommand command,
        CancellationToken cancellationToken = default);

    Task<Result> WithdrawEnrollmentAsync(
        Guid actorUserId,
        Guid enrollmentId,
        CancellationToken cancellationToken = default);
}
