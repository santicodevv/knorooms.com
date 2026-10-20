using System.Text.Json;
using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Attendance.Domain;
using Knorooms.Modules.Modules.Audit.Domain;
using Knorooms.Modules.Modules.Authorization.Domain;
using Knorooms.Modules.Modules.Enrollments.Domain;
using Knorooms.Modules.Modules.ReportCards.Contracts;
using Knorooms.Modules.Modules.ReportCards.Domain;
using Knorooms.SharedKernel.Results;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace Knorooms.Modules.Modules.ReportCards.Application;

internal sealed class ReportCardsService(
    ApplicationDbContext dbContext,
    ITenantContextAccessor tenantContextAccessor) : IReportCardsService
{
    public async Task<ReportCardsOverviewDto> GetReportCardsOverviewAsync(
        Guid? academicYearId = null,
        Guid? sectionId = null,
        string? periodCode = null,
        CancellationToken cancellationToken = default)
    {
        var normalizedPeriod = string.IsNullOrWhiteSpace(periodCode)
            ? "P1"
            : periodCode.Trim().ToUpperInvariant();

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
            return new ReportCardsOverviewDto(
                SelectedAcademicYearId: null,
                SelectedAcademicYearName: null,
                SelectedSectionId: null,
                SelectedSectionLabel: null,
                SelectedPeriodCode: normalizedPeriod,
                ActiveEvaluationPolicyVersionId: null,
                ActiveEvaluationPolicyName: null,
                StudentReadiness: [],
                Snapshots: []);
        }

        var activePolicy = await dbContext.EvaluationPolicyVersions
            .AsNoTracking()
            .Where(x => x.AcademicYearId == resolvedYear.Id)
            .OrderByDescending(x => x.VersionNumber)
            .ThenByDescending(x => x.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

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
            return new ReportCardsOverviewDto(
                SelectedAcademicYearId: resolvedYear.Id,
                SelectedAcademicYearName: resolvedYear.Name,
                SelectedSectionId: null,
                SelectedSectionLabel: null,
                SelectedPeriodCode: normalizedPeriod,
                ActiveEvaluationPolicyVersionId: activePolicy?.Id,
                ActiveEvaluationPolicyName: activePolicy is not null
                    ? $"{activePolicy.Name} ({activePolicy.PolicyCode} v{activePolicy.VersionNumber})"
                    : null,
                StudentReadiness: [],
                Snapshots: []);
        }

        var gradeName = gradeLevels.GetValueOrDefault(resolvedSection.GradeLevelId)?.DisplayName ?? "Grado";
        var sectionLabel = $"{gradeName} - Sección {resolvedSection.Code}";

        var totalGradeSubjectsCount = await dbContext.Subjects
            .AsNoTracking()
            .CountAsync(cancellationToken);

        var enrollments = await dbContext.StudentEnrollments
            .AsNoTracking()
            .Where(x => x.SectionId == resolvedSection.Id && x.Status == EnrollmentStatus.Active)
            .ToListAsync(cancellationToken);

        var enrollmentIds = enrollments.Select(x => x.Id).ToList();
        var studentIds = enrollments.Select(x => x.StudentId).Distinct().ToList();

        var studentsById = await dbContext.Students
            .AsNoTracking()
            .Where(x => studentIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, cancellationToken);

        var periodGradeEntries = await dbContext.GradeEntries
            .AsNoTracking()
            .Where(x => enrollmentIds.Contains(x.EnrollmentId) && x.PeriodCode == normalizedPeriod)
            .ToListAsync(cancellationToken);

        var snapshots = await dbContext.ReportCardSnapshots
            .AsNoTracking()
            .Where(x => enrollmentIds.Contains(x.EnrollmentId) && x.PeriodCode == normalizedPeriod)
            .OrderByDescending(x => x.VersionNumber)
            .ThenByDescending(x => x.PublishedAtUtc)
            .ToListAsync(cancellationToken);

        var policyIds = snapshots.Select(x => x.EvaluationPolicyVersionId).Distinct().ToList();
        var policiesById = await dbContext.EvaluationPolicyVersions
            .AsNoTracking()
            .Where(x => policyIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, cancellationToken);

        var publisherMembershipIds = snapshots.Select(x => x.PublishedByMembershipId).Distinct().ToList();
        var publisherNamesByMembershipId = new Dictionary<Guid, string>();
        if (publisherMembershipIds.Count > 0)
        {
            var memberships = await dbContext.TenantMemberships
                .AsNoTracking()
                .Where(x => publisherMembershipIds.Contains(x.Id))
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
                    publisherNamesByMembershipId[membership.Id] = user.DisplayName;
                }
            }
        }

        var entriesByEnrollment = periodGradeEntries
            .GroupBy(x => x.EnrollmentId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var snapshotsByEnrollment = snapshots
            .GroupBy(x => x.EnrollmentId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(s => s.VersionNumber).ToList());

        var readinessList = enrollments
            .Select(enrollment =>
            {
                var student = studentsById.GetValueOrDefault(enrollment.StudentId);
                var fullName = student is not null
                    ? $"{student.FirstName} {student.LastName}".Trim()
                    : "Estudiante";

                var studentGrades = entriesByEnrollment.GetValueOrDefault(enrollment.Id) ?? [];
                var studentSnapshots = snapshotsByEnrollment.GetValueOrDefault(enrollment.Id) ?? [];
                var latestSnapshot = studentSnapshots.FirstOrDefault();

                decimal? avgScore = studentGrades.Count > 0
                    ? Math.Round(studentGrades.Average(x => x.NumericScore), 2)
                    : null;

                return new StudentReportCardReadinessDto(
                    enrollment.Id,
                    enrollment.StudentId,
                    student?.StudentCode ?? "N/D",
                    fullName,
                    student?.SigerdExternalId,
                    studentGrades.Count,
                    totalGradeSubjectsCount,
                    avgScore,
                    latestSnapshot?.VersionNumber ?? 0,
                    latestSnapshot?.Id,
                    latestSnapshot?.PublishedAtUtc);
            })
            .OrderBy(x => x.StudentFullName, StringComparer.OrdinalIgnoreCase)
            .ToList();

        var enrollmentsById = enrollments.ToDictionary(x => x.Id);
        var snapshotDtos = snapshots
            .Select(snapshot =>
            {
                var enrollment = enrollmentsById.GetValueOrDefault(snapshot.EnrollmentId);
                var student = enrollment is not null
                    ? studentsById.GetValueOrDefault(enrollment.StudentId)
                    : null;
                var fullName = student is not null
                    ? $"{student.FirstName} {student.LastName}".Trim()
                    : "Estudiante";
                var policy = policiesById.GetValueOrDefault(snapshot.EvaluationPolicyVersionId);

                return new ReportCardSnapshotDto(
                    snapshot.Id,
                    snapshot.EnrollmentId,
                    enrollment?.StudentId ?? Guid.Empty,
                    student?.StudentCode ?? "N/D",
                    fullName,
                    sectionLabel,
                    resolvedYear.Name,
                    snapshot.EvaluationPolicyVersionId,
                    policy is not null ? $"{policy.Name} ({policy.PolicyCode} v{policy.VersionNumber})" : "Política institucional",
                    snapshot.PeriodCode,
                    snapshot.VersionNumber,
                    snapshot.ImmutablePayloadJson,
                    snapshot.PublishedByMembershipId,
                    publisherNamesByMembershipId.GetValueOrDefault(snapshot.PublishedByMembershipId, "Dirección académica"),
                    snapshot.PublishedAtUtc,
                    snapshot.SupersedesSnapshotId,
                    snapshot.CorrectionReason);
            })
            .ToList();

        return new ReportCardsOverviewDto(
            resolvedYear.Id,
            resolvedYear.Name,
            resolvedSection.Id,
            sectionLabel,
            normalizedPeriod,
            activePolicy?.Id,
            activePolicy is not null
                ? $"{activePolicy.Name} ({activePolicy.PolicyCode} v{activePolicy.VersionNumber})"
                : null,
            readinessList,
            snapshotDtos);
    }

    public async Task<Result<ReportCardSnapshotDto>> PublishReportCardAsync(
        PublishReportCardCommand command,
        CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;
        if (!scope.HasResolvedTenant || scope.TenantId is null)
        {
            return Result.Failure<ReportCardSnapshotDto>(Error.Forbidden(
                "Tenant.Required",
                "La operación requiere un contexto institucional activo."));
        }

        var tenantId = scope.TenantId.Value;

        var publisherMembershipId = await ResolveActiveMembershipIdAsync(tenantId, scope, cancellationToken);
        if (publisherMembershipId is null)
        {
            return Result.Failure<ReportCardSnapshotDto>(Error.Forbidden(
                "ReportCard.MembershipRequired",
                "Solo un miembro activo de la institución con permiso de publicación puede emitir boletines."));
        }

        var enrollment = await dbContext.StudentEnrollments
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == command.EnrollmentId, cancellationToken);

        if (enrollment is null)
        {
            return Result.Failure<ReportCardSnapshotDto>(Error.NotFound(
                "Enrollment.NotFound",
                "La matrícula especificada no existe en esta institución."));
        }

        var student = await dbContext.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == enrollment.StudentId, cancellationToken);

        var section = await dbContext.SchoolSections
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == enrollment.SectionId, cancellationToken);

        if (student is null || section is null)
        {
            return Result.Failure<ReportCardSnapshotDto>(Error.NotFound(
                "ReportCard.ContextIncomplete",
                "No se encontró el expediente estudiantil o la sección asociada a la matrícula."));
        }

        var gradeLevel = await dbContext.GradeLevels
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == section.GradeLevelId, cancellationToken);

        var academicYear = await dbContext.AcademicYears
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == enrollment.AcademicYearId, cancellationToken);

        var policy = await dbContext.EvaluationPolicyVersions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == command.EvaluationPolicyVersionId, cancellationToken);

        if (policy is null || policy.AcademicYearId != enrollment.AcademicYearId)
        {
            return Result.Failure<ReportCardSnapshotDto>(Error.Validation(
                "ReportCard.InvalidPolicyVersion",
                "La política de evaluación seleccionada no pertenece al año escolar de la matrícula."));
        }

        var normalizedPeriod = command.PeriodCode.Trim().ToUpperInvariant();

        var gradeEntries = await dbContext.GradeEntries
            .Where(x => x.EnrollmentId == enrollment.Id && x.PeriodCode == normalizedPeriod)
            .ToListAsync(cancellationToken);

        if (gradeEntries.Count == 0)
        {
            return Result.Failure<ReportCardSnapshotDto>(Error.Validation(
                "ReportCard.NoGradesRecorded",
                $"No existen calificaciones registradas en el período '{normalizedPeriod}' para emitir el boletín del estudiante."));
        }

        var subjectIds = gradeEntries.Select(x => x.SubjectId).Distinct().ToList();
        var subjectsById = await dbContext.Subjects
            .AsNoTracking()
            .Where(x => subjectIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, cancellationToken);

        var attendanceRecords = await dbContext.AttendanceRecords
            .AsNoTracking()
            .Where(x => x.EnrollmentId == enrollment.Id)
            .ToListAsync(cancellationToken);

        var minPassingScore = ExtractMinPassingScore(policy.RulesSpecificationJson);

        var subjectSnapshots = gradeEntries
            .Select(entry =>
            {
                var subject = subjectsById.GetValueOrDefault(entry.SubjectId);
                return new SubjectScoreSnapshotItem(
                    entry.SubjectId,
                    subject?.Code ?? "ASIG",
                    subject?.Name ?? "Asignatura",
                    entry.NumericScore,
                    entry.NumericScore >= minPassingScore,
                    entry.Status.ToString());
            })
            .OrderBy(x => x.SubjectCode, StringComparer.OrdinalIgnoreCase)
            .ToList();

        var averageScore = Math.Round(subjectSnapshots.Average(x => x.NumericScore), 2);
        var isPassingPeriod = subjectSnapshots.All(x => x.IsPassing) && averageScore >= minPassingScore;

        var totalAttendanceDays = attendanceRecords.Count;
        var presentDays = attendanceRecords.Count(x => x.Status == AttendanceStatus.Present);
        var absentDays = attendanceRecords.Count(x => x.Status == AttendanceStatus.Absent);
        var lateDays = attendanceRecords.Count(x => x.Status == AttendanceStatus.Late);
        var excusedDays = attendanceRecords.Count(x => x.Status == AttendanceStatus.Excused);
        var effectivePresent = presentDays + lateDays + excusedDays;
        var attendanceRate = totalAttendanceDays > 0
            ? Math.Round((decimal)effectivePresent / totalAttendanceDays * 100m, 1)
            : 100m;

        var studentFullName = $"{student.FirstName} {student.LastName}".Trim();
        var gradeName = gradeLevel?.DisplayName ?? "Grado";
        var sectionLabel = $"{gradeName} - Sección {section.Code}";
        var academicYearName = academicYear?.Name ?? "Año Escolar";

        var immutablePayload = new ReportCardImmutablePayload(
            scope.TenantName ?? "Institución Educativa",
            academicYearName,
            normalizedPeriod,
            student.StudentCode,
            studentFullName,
            student.SigerdExternalId,
            gradeName,
            section.Code,
            policy.PolicyCode,
            policy.VersionNumber,
            policy.Name,
            minPassingScore,
            averageScore,
            isPassingPeriod ? "Aprobado" : "Requiere Recuperación Pedagógica",
            subjectSnapshots,
            new ReportCardAttendanceSnapshot(
                totalAttendanceDays,
                presentDays,
                absentDays,
                lateDays,
                excusedDays,
                attendanceRate),
            DateTimeOffset.UtcNow);

        var payloadJson = JsonSerializer.Serialize(immutablePayload);

        var latestSnapshot = await dbContext.ReportCardSnapshots
            .AsNoTracking()
            .Where(x => x.EnrollmentId == enrollment.Id && x.PeriodCode == normalizedPeriod)
            .OrderByDescending(x => x.VersionNumber)
            .FirstOrDefaultAsync(cancellationToken);

        ReportCardSnapshot snapshotToSave;
        string auditAction;
        string auditSummary;

        if (latestSnapshot is null)
        {
            var initialResult = ReportCardSnapshot.PublishInitial(
                tenantId,
                enrollment.Id,
                policy.Id,
                normalizedPeriod,
                payloadJson,
                publisherMembershipId.Value);

            if (initialResult.IsFailure)
            {
                return Result.Failure<ReportCardSnapshotDto>(initialResult.Error);
            }

            snapshotToSave = initialResult.Value;
            auditAction = "report_card.published";
            auditSummary = $"Boletín inicial v1 publicado para '{studentFullName}' ({normalizedPeriod}, promedio {averageScore}).";
        }
        else
        {
            var correctedResult = latestSnapshot.CreateCorrectedVersion(
                payloadJson,
                publisherMembershipId.Value,
                command.CorrectionReason ?? string.Empty);

            if (correctedResult.IsFailure)
            {
                return Result.Failure<ReportCardSnapshotDto>(correctedResult.Error);
            }

            snapshotToSave = correctedResult.Value;
            auditAction = "report_card.rectified";
            auditSummary = $"Boletín rectificado v{snapshotToSave.VersionNumber} publicado para '{studentFullName}' ({normalizedPeriod}, promedio {averageScore}). Motivo: {snapshotToSave.CorrectionReason}";
        }

        foreach (var gradeEntry in gradeEntries)
        {
            gradeEntry.MarkPublished();
        }

        dbContext.ReportCardSnapshots.Add(snapshotToSave);

        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: tenantId,
            actorUserId: scope.UserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: scope.SupportAccessGrantId,
            action: auditAction,
            resourceType: nameof(ReportCardSnapshot),
            resourceId: snapshotToSave.Id.ToString(),
            summary: auditSummary));

        await dbContext.SaveChangesAsync(cancellationToken);

        var publisherName = await ResolveMembershipDisplayNameAsync(publisherMembershipId.Value, cancellationToken);

        return Result.Success(new ReportCardSnapshotDto(
            snapshotToSave.Id,
            snapshotToSave.EnrollmentId,
            student.Id,
            student.StudentCode,
            studentFullName,
            sectionLabel,
            academicYearName,
            policy.Id,
            $"{policy.Name} ({policy.PolicyCode} v{policy.VersionNumber})",
            snapshotToSave.PeriodCode,
            snapshotToSave.VersionNumber,
            snapshotToSave.ImmutablePayloadJson,
            snapshotToSave.PublishedByMembershipId,
            publisherName,
            snapshotToSave.PublishedAtUtc,
            snapshotToSave.SupersedesSnapshotId,
            snapshotToSave.CorrectionReason));
    }

    private static decimal ExtractMinPassingScore(string rulesJson)
    {
        try
        {
            using var doc = JsonDocument.Parse(rulesJson);
            if (doc.RootElement.TryGetProperty("MinPassingScore", out var prop) ||
                doc.RootElement.TryGetProperty("minPassingScore", out prop))
            {
                if (prop.TryGetDecimal(out var val) && val is > 0 and <= 100)
                {
                    return val;
                }
            }
        }
        catch (JsonException)
        {
            // Usa 70.0 como umbral estándar si el JSON no especifica otro
        }

        return 70m;
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

    private async Task<string> ResolveMembershipDisplayNameAsync(
        Guid membershipId,
        CancellationToken cancellationToken)
    {
        var userId = await dbContext.TenantMemberships
            .AsNoTracking()
            .Where(x => x.Id == membershipId)
            .Select(x => (Guid?)x.UserId)
            .FirstOrDefaultAsync(cancellationToken);

        if (!userId.HasValue)
        {
            return "Dirección académica";
        }

        return await dbContext.Users
            .AsNoTracking()
            .Where(x => x.Id == userId.Value)
            .Select(x => x.DisplayName)
            .FirstOrDefaultAsync(cancellationToken) ?? "Dirección académica";
    }

    private sealed record SubjectScoreSnapshotItem(
        Guid SubjectId,
        string SubjectCode,
        string SubjectName,
        decimal NumericScore,
        bool IsPassing,
        string WorkflowStatus);

    private sealed record ReportCardAttendanceSnapshot(
        int TotalDaysRecorded,
        int PresentDays,
        int AbsentDays,
        int LateDays,
        int ExcusedDays,
        decimal AttendancePercentage);

    private sealed record ReportCardImmutablePayload(
        string InstitutionName,
        string AcademicYearName,
        string PeriodCode,
        string StudentCode,
        string StudentFullName,
        string? NationalStudentId,
        string GradeName,
        string SectionName,
        string PolicyCode,
        int PolicyVersion,
        string PolicyName,
        decimal MinPassingScore,
        decimal AverageScore,
        string AcademicStanding,
        IReadOnlyList<SubjectScoreSnapshotItem> Subjects,
        ReportCardAttendanceSnapshot Attendance,
        DateTimeOffset GeneratedAtUtc);
}
