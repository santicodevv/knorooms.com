using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.Students.Contracts;

public sealed record StudentGuardianSummaryDto(
    Guid LinkId,
    Guid GuardianId,
    string FullName,
    string Email,
    string? PhoneNumber,
    string RelationshipType,
    bool HasAcademicAccess,
    bool HasFinancialResponsibility,
    bool HasPickupAuthorization);

public sealed record StudentEnrollmentSummaryDto(
    Guid EnrollmentId,
    Guid AcademicYearId,
    string AcademicYearCode,
    Guid SectionId,
    string SectionCode,
    string GradeLevelCode,
    string GradeLevelName,
    string Status);

public sealed record StudentDto(
    Guid Id,
    string StudentCode,
    string FirstName,
    string LastName,
    string FullName,
    DateOnly BirthDate,
    string? SigerdExternalId,
    bool IsActive,
    IReadOnlyList<StudentGuardianSummaryDto> Guardians,
    StudentEnrollmentSummaryDto? LatestEnrollment,
    DateTimeOffset CreatedAtUtc);

public sealed record GuardianDto(
    Guid Id,
    string FullName,
    string Email,
    string? PhoneNumber,
    Guid? UserAccountId,
    int LinkedStudentsCount,
    DateTimeOffset CreatedAtUtc);

public sealed record StudentDirectoryOverviewDto(
    IReadOnlyList<StudentDto> Students,
    IReadOnlyList<GuardianDto> Guardians);

public sealed record CreateStudentCommand(
    string StudentCode,
    string FirstName,
    string LastName,
    DateOnly BirthDate,
    string? SigerdExternalId);

public sealed record CreateGuardianCommand(
    string FullName,
    string Email,
    string? PhoneNumber);

public sealed record LinkStudentGuardianCommand(
    Guid StudentId,
    Guid GuardianId,
    string RelationshipType,
    bool HasAcademicAccess,
    bool HasFinancialResponsibility,
    bool HasPickupAuthorization);

public interface IStudentDirectoryService
{
    Task<StudentDirectoryOverviewDto> GetOverviewAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<StudentDto>> ListStudentsAsync(
        CancellationToken cancellationToken = default);

    Task<Result<StudentDto>> CreateStudentAsync(
        Guid actorUserId,
        CreateStudentCommand command,
        CancellationToken cancellationToken = default);

    Task<Result> DeactivateStudentAsync(
        Guid actorUserId,
        Guid studentId,
        CancellationToken cancellationToken = default);

    Task<Result> ActivateStudentAsync(
        Guid actorUserId,
        Guid studentId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<GuardianDto>> ListGuardiansAsync(
        CancellationToken cancellationToken = default);

    Task<Result<GuardianDto>> CreateGuardianAsync(
        Guid actorUserId,
        CreateGuardianCommand command,
        CancellationToken cancellationToken = default);

    Task<Result<StudentGuardianSummaryDto>> LinkGuardianAsync(
        Guid actorUserId,
        LinkStudentGuardianCommand command,
        CancellationToken cancellationToken = default);
}
