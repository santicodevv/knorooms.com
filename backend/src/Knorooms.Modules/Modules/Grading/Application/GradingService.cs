using System.Text.Json;
using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Audit.Domain;
using Knorooms.Modules.Modules.Authorization.Domain;
using Knorooms.Modules.Modules.Enrollments.Domain;
using Knorooms.Modules.Modules.Grading.Contracts;
using Knorooms.Modules.Modules.Grading.Domain;
using Knorooms.SharedKernel.Results;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace Knorooms.Modules.Modules.Grading.Application;

internal sealed class GradingService(
    ApplicationDbContext dbContext,
    ITenantContextAccessor tenantContextAccessor) : IGradingService
{
    private static readonly string[] DefaultPeriods = ["P1", "P2", "P3", "P4"];
    private static readonly JsonSerializerOptions CaseInsensitiveJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<GradingWorkspaceOverviewDto> GetGradingWorkspaceOverviewAsync(
        Guid? academicYearId = null,
        Guid? sectionId = null,
        Guid? subjectId = null,
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
            return new GradingWorkspaceOverviewDto(
                SelectedAcademicYearId: null,
                SelectedAcademicYearName: null,
                SelectedSectionId: null,
                SelectedSectionLabel: null,
                SelectedSubjectId: null,
                SelectedSubjectName: null,
                SelectedPeriodCode: normalizedPeriod,
                Policies: [],
                ActivePolicy: null,
                Metrics: new GradingMetricsDto(0, 0, 0, 0, 0m, 0, 70m),
                GradebookRows: []);
        }

        var policies = await dbContext.EvaluationPolicyVersions
            .AsNoTracking()
            .Where(x => x.AcademicYearId == resolvedYear.Id)
            .OrderByDescending(x => x.VersionNumber)
            .ThenByDescending(x => x.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        var policyDtos = policies
            .Select(p => MapPolicyDto(p, resolvedYear.Name))
            .ToList();

        var activePolicy = policyDtos.FirstOrDefault();
        var minPassingScore = activePolicy?.MinPassingScore ?? 70m;

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
            return new GradingWorkspaceOverviewDto(
                SelectedAcademicYearId: resolvedYear.Id,
                SelectedAcademicYearName: resolvedYear.Name,
                SelectedSectionId: null,
                SelectedSectionLabel: null,
                SelectedSubjectId: null,
                SelectedSubjectName: null,
                SelectedPeriodCode: normalizedPeriod,
                Policies: policyDtos,
                ActivePolicy: activePolicy,
                Metrics: new GradingMetricsDto(0, 0, 0, 0, 0m, 0, minPassingScore),
                GradebookRows: []);
        }

        var gradeName = gradeLevels.GetValueOrDefault(resolvedSection.GradeLevelId)?.DisplayName ?? "Grado";
        var sectionLabel = $"{gradeName} - Sección {resolvedSection.Code}";

        var subjectsForGrade = await dbContext.Subjects
            .AsNoTracking()
            .OrderBy(x => x.Code)
            .ToListAsync(cancellationToken);

        var resolvedSubject = subjectId.HasValue
            ? subjectsForGrade.FirstOrDefault(x => x.Id == subjectId.Value)
            : subjectsForGrade.FirstOrDefault();

        var enrollments = await dbContext.StudentEnrollments
            .AsNoTracking()
            .Where(x => x.SectionId == resolvedSection.Id && x.Status == EnrollmentStatus.Active)
            .ToListAsync(cancellationToken);

        if (resolvedSubject is null || enrollments.Count == 0)
        {
            var studentsForEmptyRows = await dbContext.Students
                .AsNoTracking()
                .Where(x => enrollments.Select(e => e.StudentId).Contains(x.Id))
                .ToDictionaryAsync(x => x.Id, cancellationToken);

            var emptyRows = enrollments
                .Select(e =>
                {
                    var st = studentsForEmptyRows.GetValueOrDefault(e.StudentId);
                    var fullName = st is not null ? $"{st.FirstName} {st.LastName}".Trim() : "Estudiante";
                    return new StudentGradebookRowDto(
                        e.Id,
                        e.StudentId,
                        st?.StudentCode ?? "N/D",
                        fullName,
                        GradeEntryId: null,
                        NumericScore: null,
                        Status: null,
                        IsPassing: null,
                        RecordedByMembershipId: null,
                        RecordedByDisplayName: null,
                        ApprovedByMembershipId: null,
                        ApprovedByDisplayName: null,
                        CorrectionReason: null,
                        UpdatedAtUtc: null,
                        PeriodScores: new Dictionary<string, decimal>());
                })
                .OrderBy(x => x.StudentFullName, StringComparer.OrdinalIgnoreCase)
                .ToList();

            return new GradingWorkspaceOverviewDto(
                resolvedYear.Id,
                resolvedYear.Name,
                resolvedSection.Id,
                sectionLabel,
                resolvedSubject?.Id,
                resolvedSubject?.Name,
                normalizedPeriod,
                policyDtos,
                activePolicy,
                new GradingMetricsDto(enrollments.Count, 0, 0, 0, 0m, 0, minPassingScore),
                emptyRows);
        }

        var studentIds = enrollments.Select(x => x.StudentId).Distinct().ToList();
        var studentsById = await dbContext.Students
            .AsNoTracking()
            .Where(x => studentIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, cancellationToken);

        var enrollmentIds = enrollments.Select(x => x.Id).ToList();
        var subjectGradeEntries = await dbContext.GradeEntries
            .AsNoTracking()
            .Where(x => x.SubjectId == resolvedSubject.Id && enrollmentIds.Contains(x.EnrollmentId))
            .ToListAsync(cancellationToken);

        var membershipIds = subjectGradeEntries
            .SelectMany(x => new Guid?[] { x.RecordedByMembershipId, x.ApprovedByMembershipId })
            .Where(x => x.HasValue)
            .Select(x => x!.Value)
            .Distinct()
            .ToList();

        var memberDisplayNames = new Dictionary<Guid, string>();
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
                    memberDisplayNames[membership.Id] = user.DisplayName;
                }
            }
        }

        var entriesByEnrollment = subjectGradeEntries
            .GroupBy(x => x.EnrollmentId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var rows = enrollments
            .Select(enrollment =>
            {
                var student = studentsById.GetValueOrDefault(enrollment.StudentId);
                var fullName = student is not null
                    ? $"{student.FirstName} {student.LastName}".Trim()
                    : "Estudiante";

                var studentEntries = entriesByEnrollment.GetValueOrDefault(enrollment.Id) ?? [];
                var periodEntry = studentEntries.FirstOrDefault(e =>
                    string.Equals(e.PeriodCode, normalizedPeriod, StringComparison.OrdinalIgnoreCase));

                var periodScores = studentEntries
                    .GroupBy(e => e.PeriodCode, StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(
                        g => g.Key.ToUpperInvariant(),
                        g => g.First().NumericScore,
                        StringComparer.OrdinalIgnoreCase);

                bool? isPassing = periodEntry is not null
                    ? periodEntry.NumericScore >= minPassingScore
                    : null;

                return new StudentGradebookRowDto(
                    enrollment.Id,
                    enrollment.StudentId,
                    student?.StudentCode ?? "N/D",
                    fullName,
                    periodEntry?.Id,
                    periodEntry?.NumericScore,
                    periodEntry?.Status.ToString(),
                    isPassing,
                    periodEntry?.RecordedByMembershipId,
                    periodEntry is not null
                        ? memberDisplayNames.GetValueOrDefault(periodEntry.RecordedByMembershipId, "Docente")
                        : null,
                    periodEntry?.ApprovedByMembershipId,
                    periodEntry?.ApprovedByMembershipId is Guid approverId
                        ? memberDisplayNames.GetValueOrDefault(approverId, "Coordinación")
                        : null,
                    periodEntry?.CorrectionReason,
                    periodEntry?.UpdatedAtUtc ?? periodEntry?.CreatedAtUtc,
                    periodScores);
            })
            .OrderBy(x => x.StudentFullName, StringComparer.OrdinalIgnoreCase)
            .ToList();

        var gradedRows = rows.Where(r => r.NumericScore.HasValue).ToList();
        var gradedCount = gradedRows.Count;
        var approvedCount = rows.Count(r => r.Status == nameof(GradeWorkflowStatus.Approved));
        var publishedCount = rows.Count(r => r.Status == nameof(GradeWorkflowStatus.Published));
        var averageScore = gradedCount > 0
            ? Math.Round(gradedRows.Average(r => r.NumericScore!.Value), 2)
            : 0m;
        var passingCount = rows.Count(r => r.IsPassing == true);

        return new GradingWorkspaceOverviewDto(
            resolvedYear.Id,
            resolvedYear.Name,
            resolvedSection.Id,
            sectionLabel,
            resolvedSubject.Id,
            resolvedSubject.Name,
            normalizedPeriod,
            policyDtos,
            activePolicy,
            new GradingMetricsDto(
                rows.Count,
                gradedCount,
                approvedCount,
                publishedCount,
                averageScore,
                passingCount,
                minPassingScore),
            rows);
    }

    public async Task<Result<EvaluationPolicyVersionDto>> CreateEvaluationPolicyAsync(
        CreateEvaluationPolicyCommand command,
        CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;
        if (!scope.HasResolvedTenant || scope.TenantId is null)
        {
            return Result.Failure<EvaluationPolicyVersionDto>(Error.Forbidden(
                "Tenant.Required",
                "La operación requiere un contexto institucional activo."));
        }

        var tenantId = scope.TenantId.Value;

        if (command.MinPassingScore is < 1 or > 100)
        {
            return Result.Failure<EvaluationPolicyVersionDto>(Error.Validation(
                "EvaluationPolicy.InvalidMinPassingScore",
                "La calificación mínima aprobatoria debe estar entre 1 y 100 puntos."));
        }

        var academicYear = await dbContext.AcademicYears
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == command.AcademicYearId, cancellationToken);

        if (academicYear is null)
        {
            return Result.Failure<EvaluationPolicyVersionDto>(Error.NotFound(
                "Academic.YearNotFound",
                "El año escolar especificado no existe en esta institución."));
        }

        var normalizedCode = command.PolicyCode.Trim().ToUpperInvariant();
        var duplicateExists = await dbContext.EvaluationPolicyVersions
            .AnyAsync(
                x => x.AcademicYearId == command.AcademicYearId &&
                     x.PolicyCode == normalizedCode &&
                     x.VersionNumber == command.VersionNumber,
                cancellationToken);

        if (duplicateExists)
        {
            return Result.Failure<EvaluationPolicyVersionDto>(Error.Conflict(
                "EvaluationPolicy.DuplicateVersion",
                $"Ya existe la versión v{command.VersionNumber} para la política '{normalizedCode}' en el año escolar '{academicYear.Name}'."));
        }

        var enabledPeriods = (command.EnabledPeriods ?? DefaultPeriods)
            .Where(p => !string.IsNullOrWhiteSpace(p))
            .Select(p => p.Trim().ToUpperInvariant())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (enabledPeriods.Length == 0)
        {
            enabledPeriods = DefaultPeriods;
        }

        var rulesJson = JsonSerializer.Serialize(new PolicyRulesPayload(
            command.MinPassingScore,
            100m,
            enabledPeriods,
            string.IsNullOrWhiteSpace(command.Notes) ? null : command.Notes.Trim()));

        var policyResult = EvaluationPolicyVersion.Create(
            tenantId,
            command.AcademicYearId,
            normalizedCode,
            command.VersionNumber,
            command.Name,
            rulesJson,
            command.IsValidatedWithPilotSchool);

        if (policyResult.IsFailure)
        {
            return Result.Failure<EvaluationPolicyVersionDto>(policyResult.Error);
        }

        var policy = policyResult.Value;
        dbContext.EvaluationPolicyVersions.Add(policy);

        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: tenantId,
            actorUserId: scope.UserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: scope.SupportAccessGrantId,
            action: "grading.policy_created",
            resourceType: nameof(EvaluationPolicyVersion),
            resourceId: policy.Id.ToString(),
            summary: $"Política de evaluación '{policy.PolicyCode}' v{policy.VersionNumber} ({policy.Name}) creada para el año escolar '{academicYear.Name}'."));

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(MapPolicyDto(policy, academicYear.Name));
    }

    public async Task<Result<GradesBatchRecordResultDto>> RecordSectionGradesBatchAsync(
        RecordSectionGradesBatchCommand command,
        CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;
        if (!scope.HasResolvedTenant || scope.TenantId is null)
        {
            return Result.Failure<GradesBatchRecordResultDto>(Error.Forbidden(
                "Tenant.Required",
                "La operación requiere un contexto institucional activo."));
        }

        var tenantId = scope.TenantId.Value;

        if (command.Grades.Count == 0)
        {
            return Result.Failure<GradesBatchRecordResultDto>(Error.Validation(
                "Grading.EmptyBatch",
                "Debe proporcionar al menos una calificación para guardar."));
        }

        var membershipId = await ResolveActiveMembershipIdAsync(tenantId, scope, cancellationToken);
        if (membershipId is null)
        {
            return Result.Failure<GradesBatchRecordResultDto>(Error.Forbidden(
                "Grading.MembershipRequired",
                "Solo un miembro activo de la institución puede registrar calificaciones."));
        }

        var section = await dbContext.SchoolSections
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == command.SectionId, cancellationToken);

        if (section is null)
        {
            return Result.Failure<GradesBatchRecordResultDto>(Error.NotFound(
                "Academic.SectionNotFound",
                "La sección seleccionada no existe en esta institución."));
        }

        var subject = await dbContext.Subjects
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == command.SubjectId, cancellationToken);

        if (subject is null)
        {
            return Result.Failure<GradesBatchRecordResultDto>(Error.NotFound(
                "Academic.SubjectNotFound",
                "La asignatura seleccionada no existe en esta institución."));
        }

        var policy = await dbContext.EvaluationPolicyVersions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == command.EvaluationPolicyVersionId, cancellationToken);

        if (policy is null || policy.AcademicYearId != section.AcademicYearId)
        {
            return Result.Failure<GradesBatchRecordResultDto>(Error.Validation(
                "Grading.InvalidPolicyVersion",
                "La política de evaluación seleccionada no corresponde al año escolar de la sección."));
        }

        var normalizedPeriod = command.PeriodCode.Trim().ToUpperInvariant();
        var requestedEnrollmentIds = command.Grades.Select(x => x.EnrollmentId).Distinct().ToList();

        if (requestedEnrollmentIds.Count != command.Grades.Count)
        {
            return Result.Failure<GradesBatchRecordResultDto>(Error.Validation(
                "Grading.DuplicateEnrollmentInBatch",
                "El lote contiene múltiples calificaciones para el mismo estudiante."));
        }

        var validEnrollmentIds = await dbContext.StudentEnrollments
            .AsNoTracking()
            .Where(x => x.SectionId == command.SectionId &&
                        x.Status == EnrollmentStatus.Active &&
                        requestedEnrollmentIds.Contains(x.Id))
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        if (validEnrollmentIds.Count != requestedEnrollmentIds.Count)
        {
            return Result.Failure<GradesBatchRecordResultDto>(Error.Validation(
                "Grading.InvalidSectionEnrollment",
                "Una o más matrículas no pertenecen a la sección seleccionada o no están activas."));
        }

        var existingEntries = await dbContext.GradeEntries
            .Where(x => x.SubjectId == command.SubjectId &&
                        x.PeriodCode == normalizedPeriod &&
                        requestedEnrollmentIds.Contains(x.EnrollmentId))
            .ToDictionaryAsync(x => x.EnrollmentId, cancellationToken);

        var createdCount = 0;
        var updatedCount = 0;

        foreach (var gradeInput in command.Grades)
        {
            if (existingEntries.TryGetValue(gradeInput.EnrollmentId, out var existingEntry))
            {
                var updateResult = existingEntry.UpdateScore(
                    gradeInput.NumericScore,
                    membershipId.Value,
                    gradeInput.CorrectionReason);

                if (updateResult.IsFailure)
                {
                    return Result.Failure<GradesBatchRecordResultDto>(updateResult.Error);
                }

                updatedCount++;
            }
            else
            {
                var createResult = GradeEntry.RecordDraft(
                    tenantId,
                    gradeInput.EnrollmentId,
                    command.SubjectId,
                    command.EvaluationPolicyVersionId,
                    normalizedPeriod,
                    gradeInput.NumericScore,
                    membershipId.Value);

                if (createResult.IsFailure)
                {
                    return Result.Failure<GradesBatchRecordResultDto>(createResult.Error);
                }

                dbContext.GradeEntries.Add(createResult.Value);
                createdCount++;
            }
        }

        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: tenantId,
            actorUserId: scope.UserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: scope.SupportAccessGrantId,
            action: "grading.batch_recorded",
            resourceType: nameof(GradeEntry),
            resourceId: $"{command.SectionId}:{command.SubjectId}:{normalizedPeriod}",
            summary: $"Calificaciones registradas para '{subject.Name}' ({normalizedPeriod}) en sección '{section.Code}' ({createdCount} nuevas, {updatedCount} actualizadas)."));

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(new GradesBatchRecordResultDto(
            command.SectionId,
            command.SubjectId,
            normalizedPeriod,
            command.Grades.Count,
            createdCount,
            updatedCount));
    }

    public async Task<Result<GradeEntryDto>> ApproveGradeEntryAsync(
        Guid gradeEntryId,
        CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;
        if (!scope.HasResolvedTenant || scope.TenantId is null)
        {
            return Result.Failure<GradeEntryDto>(Error.Forbidden(
                "Tenant.Required",
                "La operación requiere un contexto institucional activo."));
        }

        var tenantId = scope.TenantId.Value;
        var approverMembershipId = await ResolveActiveMembershipIdAsync(tenantId, scope, cancellationToken);
        if (approverMembershipId is null)
        {
            return Result.Failure<GradeEntryDto>(Error.Forbidden(
                "Grading.MembershipRequired",
                "Solo un miembro activo de la institución con permiso de aprobación puede aprobar calificaciones."));
        }

        var entry = await dbContext.GradeEntries
            .FirstOrDefaultAsync(x => x.Id == gradeEntryId, cancellationToken);

        if (entry is null)
        {
            return Result.Failure<GradeEntryDto>(Error.NotFound(
                "GradeEntry.NotFound",
                "El registro de calificación solicitado no existe en esta institución."));
        }

        var approveResult = entry.Approve(approverMembershipId.Value);
        if (approveResult.IsFailure)
        {
            return Result.Failure<GradeEntryDto>(approveResult.Error);
        }

        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: tenantId,
            actorUserId: scope.UserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: scope.SupportAccessGrantId,
            action: "grading.entry_approved",
            resourceType: nameof(GradeEntry),
            resourceId: entry.Id.ToString(),
            summary: $"Calificación {entry.NumericScore} ({entry.PeriodCode}) aprobada para publicación por membresía {approverMembershipId.Value}."));

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(new GradeEntryDto(
            entry.Id,
            entry.EnrollmentId,
            entry.SubjectId,
            entry.EvaluationPolicyVersionId,
            entry.PeriodCode,
            entry.NumericScore,
            entry.Status.ToString(),
            entry.RecordedByMembershipId,
            entry.ApprovedByMembershipId,
            entry.CorrectionReason,
            entry.UpdatedAtUtc ?? entry.CreatedAtUtc));
    }

    internal static EvaluationPolicyVersionDto MapPolicyDto(EvaluationPolicyVersion policy, string academicYearName)
    {
        var minPassingScore = 70m;
        IReadOnlyList<string> enabledPeriods = DefaultPeriods;

        try
        {
            var parsed = JsonSerializer.Deserialize<PolicyRulesPayload>(
                policy.RulesSpecificationJson,
                CaseInsensitiveJsonOptions);

            if (parsed is not null)
            {
                if (parsed.MinPassingScore is > 0 and <= 100)
                {
                    minPassingScore = parsed.MinPassingScore;
                }

                if (parsed.EnabledPeriods is { Count: > 0 })
                {
                    enabledPeriods = parsed.EnabledPeriods;
                }
            }
        }
        catch (JsonException)
        {
            // Usa valores por defecto si el JSON fue personalizado manualmente
        }

        return new EvaluationPolicyVersionDto(
            policy.Id,
            policy.AcademicYearId,
            academicYearName,
            policy.PolicyCode,
            policy.VersionNumber,
            policy.Name,
            policy.RulesSpecificationJson,
            minPassingScore,
            enabledPeriods,
            policy.IsValidatedWithPilotSchool,
            policy.CreatedAtUtc);
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

    private sealed record PolicyRulesPayload(
        decimal MinPassingScore,
        decimal MaxScore,
        IReadOnlyList<string> EnabledPeriods,
        string? Notes);
}
