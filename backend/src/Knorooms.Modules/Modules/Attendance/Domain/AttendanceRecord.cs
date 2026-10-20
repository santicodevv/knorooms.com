using Knorooms.SharedKernel.Domain;
using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.Attendance.Domain;

public enum AttendanceStatus
{
    Present = 1,
    Absent = 2,
    Late = 3,
    Excused = 4
}

public sealed class AttendanceRecord : TenantScopedEntity
{
    public Guid EnrollmentId { get; private set; }

    public Guid SectionId { get; private set; }

    public DateOnly AttendanceDate { get; private set; }

    public AttendanceStatus Status { get; private set; }

    public Guid RecordedByMembershipId { get; private set; }

    public string? JustificationNote { get; private set; }

    private AttendanceRecord()
    {
    }

    public static Result<AttendanceRecord> Create(
        Guid tenantId,
        Guid enrollmentId,
        Guid sectionId,
        DateOnly attendanceDate,
        AttendanceStatus status,
        Guid recordedByMembershipId,
        string? justificationNote = null)
    {
        if (tenantId == Guid.Empty || enrollmentId == Guid.Empty || sectionId == Guid.Empty || recordedByMembershipId == Guid.Empty)
        {
            return Result.Failure<AttendanceRecord>(Error.Validation(
                "Attendance.InvalidIds",
                "TenantId, EnrollmentId, SectionId y RecordedByMembershipId son obligatorios."));
        }

        return Result.Success(new AttendanceRecord
        {
            Id = Guid.CreateVersion7(),
            TenantId = tenantId,
            EnrollmentId = enrollmentId,
            SectionId = sectionId,
            AttendanceDate = attendanceDate,
            Status = status,
            RecordedByMembershipId = recordedByMembershipId,
            JustificationNote = string.IsNullOrWhiteSpace(justificationNote) ? null : justificationNote.Trim()
        });
    }

    public Result Update(
        AttendanceStatus status,
        Guid recordedByMembershipId,
        string? justificationNote = null)
    {
        if (recordedByMembershipId == Guid.Empty)
        {
            return Result.Failure(Error.Validation(
                "Attendance.InvalidRecorder",
                "Se requiere la membresía institucional que actualiza la asistencia."));
        }

        Status = status;
        RecordedByMembershipId = recordedByMembershipId;
        JustificationNote = string.IsNullOrWhiteSpace(justificationNote) ? null : justificationNote.Trim();
        MarkUpdated();
        return Result.Success();
    }
}
