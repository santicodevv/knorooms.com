using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Attendance.Contracts;
using Knorooms.Modules.Modules.Attendance.Domain;
using Knorooms.Modules.Modules.Audit.Domain;
using Knorooms.Modules.Modules.Authorization.Domain;
using Knorooms.Modules.Modules.Enrollments.Domain;
using Knorooms.SharedKernel.Results;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace Knorooms.Modules.Modules.Attendance.Application;

internal sealed class AttendanceService(
    ApplicationDbContext dbContext,
    ITenantContextAccessor tenantContextAccessor) : IAttendanceService
{
    public async Task<SectionAttendanceOverviewDto> GetSectionAttendanceOverviewAsync(
        Guid? academicYearId = null,
        Guid? sectionId = null,
        DateOnly? attendanceDate = null,
        CancellationToken cancellationToken = default)
    {
        var selectedDate = attendanceDate ?? DateOnly.FromDateTime(DateTime.UtcNow);

        var academicYears = await dbContext.AcademicYears
            .AsNoTracking()
            .OrderBy(x => x.IsClosed)
            .ThenByDescending(x => x.StartDate)
            .ToListAsync(cancellationToken);

        var resolvedYear = academicYearId.HasValue
            ? academicYears.FirstOrDefault(x => x.Id == academicYearId.Value)
            : academicYears.FirstOrDefault(x => !x.IsClosed) ?? academicYears.FirstOrDefault();

        if (resolvedYear is null)
        {
            return new SectionAttendanceOverviewDto(
                SelectedAcademicYearId: null,
                SelectedAcademicYearName: null,
                SelectedSectionId: null,
                SelectedSectionLabel: null,
                SelectedDate: selectedDate,
                Metrics: new AttendanceDailyMetricsDto(0, 0, 0, 0, 0, 0, 0m),
                Roster: []);
        }

        var gradeLevels = await dbContext.GradeLevels
            .AsNoTracking()
            .OrderBy(x => x.OfficialGradeNumber)
            .ToDictionaryAsync(x => x.Id, cancellationToken);

        var sections = await dbContext.SchoolSections
            .AsNoTracking()
            .Where(x => x.AcademicYearId == resolvedYear.Id)
            .OrderBy(x => x.Code)
            .ToListAsync(cancellationToken);

        var resolvedSection = sectionId.HasValue
            ? sections.FirstOrDefault(x => x.Id == sectionId.Value)
            : sections.FirstOrDefault();

        if (resolvedSection is null)
        {
            return new SectionAttendanceOverviewDto(
                SelectedAcademicYearId: resolvedYear.Id,
                SelectedAcademicYearName: resolvedYear.Name,
                SelectedSectionId: null,
                SelectedSectionLabel: null,
                SelectedDate: selectedDate,
                Metrics: new AttendanceDailyMetricsDto(0, 0, 0, 0, 0, 0, 0m),
                Roster: []);
        }

        var gradeName = gradeLevels.GetValueOrDefault(resolvedSection.GradeLevelId)?.DisplayName ?? "Grado";
        var sectionLabel = $"{gradeName} - Sección {resolvedSection.Code}";

        var enrollments = await dbContext.StudentEnrollments
            .AsNoTracking()
            .Where(x => x.SectionId == resolvedSection.Id && x.Status == EnrollmentStatus.Active)
            .ToListAsync(cancellationToken);

        var studentIds = enrollments.Select(x => x.StudentId).Distinct().ToList();
        var studentsById = await dbContext.Students
            .AsNoTracking()
            .Where(x => studentIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, cancellationToken);

        var enrollmentIds = enrollments.Select(x => x.Id).ToList();
        var allSectionAttendanceRecords = await dbContext.AttendanceRecords
            .AsNoTracking()
            .Where(x => enrollmentIds.Contains(x.EnrollmentId))
            .ToListAsync(cancellationToken);

        var membershipIds = allSectionAttendanceRecords
            .Where(x => x.AttendanceDate == selectedDate)
            .Select(x => x.RecordedByMembershipId)
            .Distinct()
            .ToList();

        var recorderNamesByMembershipId = new Dictionary<Guid, string>();
        if (membershipIds.Count > 0)
        {
            var memberships = await dbContext.TenantMemberships
                .AsNoTracking()
                .Where(x => membershipIds.Contains(x.Id))
                .ToListAsync(cancellationToken);

            var userIds = memberships.Select(x => x.UserId).Distinct().ToList();
            var usersById = await dbContext.Users
                .AsNoTracking()
                .Where(x => userIds.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id, cancellationToken);

            foreach (var membership in memberships)
            {
                if (usersById.TryGetValue(membership.UserId, out var user))
                {
                    recorderNamesByMembershipId[membership.Id] = user.DisplayName;
                }
            }
        }

        var recordsByEnrollment = allSectionAttendanceRecords
            .GroupBy(x => x.EnrollmentId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var roster = enrollments
            .Select(enrollment =>
            {
                var student = studentsById.GetValueOrDefault(enrollment.StudentId);
                var fullName = student is not null
                    ? $"{student.FirstName} {student.LastName}".Trim()
                    : "Estudiante";

                var studentRecords = recordsByEnrollment.GetValueOrDefault(enrollment.Id) ?? [];
                var todayRecord = studentRecords.FirstOrDefault(r => r.AttendanceDate == selectedDate);

                var totalDays = studentRecords.Count;
                var presentDays = studentRecords.Count(r => r.Status == AttendanceStatus.Present);
                var absentDays = studentRecords.Count(r => r.Status == AttendanceStatus.Absent);
                var lateDays = studentRecords.Count(r => r.Status == AttendanceStatus.Late);
                var excusedDays = studentRecords.Count(r => r.Status == AttendanceStatus.Excused);

                var effectivePresent = presentDays + lateDays + excusedDays;
                var cumulativeRate = totalDays > 0
                    ? Math.Round((decimal)effectivePresent / totalDays * 100m, 1)
                    : 100m;

                return new SectionAttendanceRosterItemDto(
                    enrollment.Id,
                    enrollment.StudentId,
                    student?.StudentCode ?? "N/D",
                    fullName,
                    student?.SigerdExternalId,
                    todayRecord?.Id,
                    todayRecord?.Status.ToString(),
                    todayRecord?.JustificationNote,
                    todayRecord?.RecordedByMembershipId,
                    todayRecord is not null
                        ? recorderNamesByMembershipId.GetValueOrDefault(todayRecord.RecordedByMembershipId, "Personal docente")
                        : null,
                    todayRecord?.UpdatedAtUtc ?? todayRecord?.CreatedAtUtc,
                    new StudentAttendanceSummaryDto(
                        totalDays,
                        presentDays,
                        absentDays,
                        lateDays,
                        excusedDays,
                        cumulativeRate));
            })
            .OrderBy(x => x.StudentFullName, StringComparer.OrdinalIgnoreCase)
            .ToList();

        var totalEnrolled = roster.Count;
        var recordedCount = roster.Count(x => x.Status is not null);
        var presentCount = roster.Count(x => x.Status == nameof(AttendanceStatus.Present));
        var absentCount = roster.Count(x => x.Status == nameof(AttendanceStatus.Absent));
        var lateCount = roster.Count(x => x.Status == nameof(AttendanceStatus.Late));
        var excusedCount = roster.Count(x => x.Status == nameof(AttendanceStatus.Excused));
        var dailyEffectivePresent = presentCount + lateCount + excusedCount;
        var dailyRate = recordedCount > 0
            ? Math.Round((decimal)dailyEffectivePresent / recordedCount * 100m, 1)
            : 0m;

        return new SectionAttendanceOverviewDto(
            resolvedYear.Id,
            resolvedYear.Name,
            resolvedSection.Id,
            sectionLabel,
            selectedDate,
            new AttendanceDailyMetricsDto(
                totalEnrolled,
                recordedCount,
                presentCount,
                absentCount,
                lateCount,
                excusedCount,
                dailyRate),
            roster);
    }

    public async Task<Result<AttendanceBatchRecordResultDto>> RecordSectionAttendanceBatchAsync(
        RecordSectionAttendanceBatchCommand command,
        CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;
        if (!scope.HasResolvedTenant || scope.TenantId is null)
        {
            return Result.Failure<AttendanceBatchRecordResultDto>(Error.Forbidden(
                "Tenant.Required",
                "La operación requiere un contexto institucional activo."));
        }

        var tenantId = scope.TenantId.Value;

        if (command.Entries.Count == 0)
        {
            return Result.Failure<AttendanceBatchRecordResultDto>(Error.Validation(
                "Attendance.EmptyBatch",
                "Debe incluir al menos un registro de asistencia en el lote."));
        }

        var membershipId = await ResolveActiveMembershipIdAsync(tenantId, scope, cancellationToken);
        if (membershipId is null)
        {
            return Result.Failure<AttendanceBatchRecordResultDto>(Error.Forbidden(
                "Attendance.MembershipRequired",
                "Solo un miembro activo de la institución puede registrar o modificar la asistencia escolar."));
        }

        var section = await dbContext.SchoolSections
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == command.SectionId, cancellationToken);

        if (section is null)
        {
            return Result.Failure<AttendanceBatchRecordResultDto>(Error.NotFound(
                "Academic.SectionNotFound",
                "La sección seleccionada no existe en esta institución."));
        }

        var requestedEnrollmentIds = command.Entries
            .Select(x => x.EnrollmentId)
            .Distinct()
            .ToList();

        if (requestedEnrollmentIds.Count != command.Entries.Count)
        {
            return Result.Failure<AttendanceBatchRecordResultDto>(Error.Validation(
                "Attendance.DuplicateEnrollmentInBatch",
                "El lote contiene múltiples registros para la misma matrícula estudiantil."));
        }

        var validEnrollments = await dbContext.StudentEnrollments
            .AsNoTracking()
            .Where(x => x.SectionId == command.SectionId &&
                        x.Status == EnrollmentStatus.Active &&
                        requestedEnrollmentIds.Contains(x.Id))
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        if (validEnrollments.Count != requestedEnrollmentIds.Count)
        {
            return Result.Failure<AttendanceBatchRecordResultDto>(Error.Validation(
                "Attendance.InvalidSectionEnrollment",
                "Una o más matrículas no pertenecen a la sección seleccionada o no se encuentran activas."));
        }

        var existingRecords = await dbContext.AttendanceRecords
            .Where(x => x.SectionId == command.SectionId &&
                        x.AttendanceDate == command.AttendanceDate &&
                        requestedEnrollmentIds.Contains(x.EnrollmentId))
            .ToDictionaryAsync(x => x.EnrollmentId, cancellationToken);

        var createdCount = 0;
        var updatedCount = 0;

        foreach (var entry in command.Entries)
        {
            if (!Enum.TryParse<AttendanceStatus>(entry.Status, ignoreCase: true, out var parsedStatus))
            {
                return Result.Failure<AttendanceBatchRecordResultDto>(Error.Validation(
                    "Attendance.InvalidStatus",
                    $"El estado de asistencia '{entry.Status}' no es válido. Use Present, Absent, Late o Excused."));
            }

            if (existingRecords.TryGetValue(entry.EnrollmentId, out var existingRecord))
            {
                var updateResult = existingRecord.Update(parsedStatus, membershipId.Value, entry.JustificationNote);
                if (updateResult.IsFailure)
                {
                    return Result.Failure<AttendanceBatchRecordResultDto>(updateResult.Error);
                }

                updatedCount++;
            }
            else
            {
                var createResult = AttendanceRecord.Create(
                    tenantId,
                    entry.EnrollmentId,
                    command.SectionId,
                    command.AttendanceDate,
                    parsedStatus,
                    membershipId.Value,
                    entry.JustificationNote);

                if (createResult.IsFailure)
                {
                    return Result.Failure<AttendanceBatchRecordResultDto>(createResult.Error);
                }

                dbContext.AttendanceRecords.Add(createResult.Value);
                createdCount++;
            }
        }

        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: tenantId,
            actorUserId: scope.UserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: scope.SupportAccessGrantId,
            action: "attendance.batch_recorded",
            resourceType: nameof(AttendanceRecord),
            resourceId: $"{command.SectionId}:{command.AttendanceDate:yyyy-MM-dd}",
            summary: $"Asistencia registrada para la sección '{section.Code}' en fecha {command.AttendanceDate:yyyy-MM-dd} ({createdCount} nuevos, {updatedCount} actualizados)."));

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(new AttendanceBatchRecordResultDto(
            command.SectionId,
            command.AttendanceDate,
            command.Entries.Count,
            createdCount,
            updatedCount));
    }

    private async Task<Guid?> ResolveActiveMembershipIdAsync(
        Guid tenantId,
        ExecutionScopeContext scope,
        CancellationToken cancellationToken)
    {
        if (scope.MembershipId.HasValue && scope.MembershipId.Value != Guid.Empty)
        {
            return scope.MembershipId.Value;
        }

        if (!scope.UserId.HasValue || scope.UserId.Value == Guid.Empty)
        {
            return null;
        }

        return await dbContext.TenantMemberships
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId &&
                        x.UserId == scope.UserId.Value &&
                        x.Status == MembershipStatus.Active)
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync(cancellationToken);
    }
}
