using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Academic.Contracts;
using Knorooms.Modules.Modules.Academic.Domain;
using Knorooms.Modules.Modules.Audit.Domain;
using Knorooms.Modules.Modules.Authorization.Domain;
using Knorooms.SharedKernel.Results;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace Knorooms.Modules.Modules.Academic.Application;

internal sealed class AcademicStructureService(
    ApplicationDbContext dbContext,
    ITenantContextAccessor tenantContextAccessor) : IAcademicStructureService
{
    public async Task<AcademicStructureOverviewDto> GetOverviewAsync(
        CancellationToken cancellationToken = default)
    {
        var years = await ListAcademicYearsAsync(cancellationToken);
        var grades = await ListGradeLevelsAsync(cancellationToken);
        var sections = await ListSectionsAsync(null, null, cancellationToken);
        var subjects = await ListSubjectsAsync(cancellationToken);
        var assignments = await ListTeacherAssignmentsAsync(null, null, cancellationToken);

        return new AcademicStructureOverviewDto(years, grades, sections, subjects, assignments);
    }

    public async Task<IReadOnlyList<AcademicYearDto>> ListAcademicYearsAsync(
        CancellationToken cancellationToken = default)
    {
        var tenantId = tenantContextAccessor.Current.TenantId;
        if (tenantId is null)
        {
            return [];
        }

        return await dbContext.AcademicYears
            .AsNoTracking()
            .Where(y => y.TenantId == tenantId.Value)
            .OrderByDescending(y => y.StartDate)
            .ThenBy(y => y.Code)
            .Select(y => new AcademicYearDto(
                y.Id,
                y.Code,
                y.Name,
                y.StartDate,
                y.EndDate,
                y.IsClosed,
                dbContext.SchoolSections.Count(s => s.TenantId == tenantId.Value && s.AcademicYearId == y.Id),
                y.CreatedAtUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<Result<AcademicYearDto>> CreateAcademicYearAsync(
        Guid actorUserId,
        CreateAcademicYearCommand command,
        CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;
        if (scope.TenantId is null)
        {
            return Result.Failure<AcademicYearDto>(Error.Forbidden(
                "Tenant.NotResolved",
                "No existe un contexto institucional activo."));
        }

        var normalizedCode = command.Code.Trim().ToUpperInvariant();
        var exists = await dbContext.AcademicYears
            .AsNoTracking()
            .AnyAsync(y => y.TenantId == scope.TenantId.Value && y.Code == normalizedCode, cancellationToken);

        if (exists)
        {
            return Result.Failure<AcademicYearDto>(Error.Conflict(
                "AcademicYear.DuplicateCode",
                $"Ya existe un año escolar con el código '{normalizedCode}' en esta institución."));
        }

        var createResult = AcademicYear.Create(
            scope.TenantId.Value,
            normalizedCode,
            command.Name,
            command.StartDate,
            command.EndDate);

        if (createResult.IsFailure)
        {
            return Result.Failure<AcademicYearDto>(createResult.Error);
        }

        var year = createResult.Value;
        dbContext.AcademicYears.Add(year);
        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: scope.TenantId.Value,
            actorUserId: actorUserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: scope.SupportAccessGrantId,
            action: "academic.year_created",
            resourceType: "AcademicYear",
            resourceId: year.Id.ToString(),
            summary: $"Año escolar '{year.Name}' ({year.Code}) creado ({year.StartDate:yyyy-MM-dd} a {year.EndDate:yyyy-MM-dd})."));

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(new AcademicYearDto(
            year.Id,
            year.Code,
            year.Name,
            year.StartDate,
            year.EndDate,
            year.IsClosed,
            SectionsCount: 0,
            year.CreatedAtUtc));
    }

    public async Task<Result> CloseAcademicYearAsync(
        Guid actorUserId,
        Guid academicYearId,
        CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;
        if (scope.TenantId is null)
        {
            return Result.Failure(Error.Forbidden("Tenant.NotResolved", "No existe un contexto institucional activo."));
        }

        var year = await dbContext.AcademicYears
            .FirstOrDefaultAsync(y => y.TenantId == scope.TenantId.Value && y.Id == academicYearId, cancellationToken);

        if (year is null)
        {
            return Result.Failure(Error.NotFound("AcademicYear.NotFound", "El año escolar no existe en este colegio."));
        }

        var closeResult = year.Close();
        if (closeResult.IsFailure)
        {
            return closeResult;
        }

        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: scope.TenantId.Value,
            actorUserId: actorUserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: scope.SupportAccessGrantId,
            action: "academic.year_closed",
            resourceType: "AcademicYear",
            resourceId: year.Id.ToString(),
            summary: $"Año escolar '{year.Name}' ({year.Code}) cerrado."));

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    public async Task<Result> ReopenAcademicYearAsync(
        Guid actorUserId,
        Guid academicYearId,
        CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;
        if (scope.TenantId is null)
        {
            return Result.Failure(Error.Forbidden("Tenant.NotResolved", "No existe un contexto institucional activo."));
        }

        var year = await dbContext.AcademicYears
            .FirstOrDefaultAsync(y => y.TenantId == scope.TenantId.Value && y.Id == academicYearId, cancellationToken);

        if (year is null)
        {
            return Result.Failure(Error.NotFound("AcademicYear.NotFound", "El año escolar no existe en este colegio."));
        }

        var reopenResult = year.Reopen();
        if (reopenResult.IsFailure)
        {
            return reopenResult;
        }

        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: scope.TenantId.Value,
            actorUserId: actorUserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: scope.SupportAccessGrantId,
            action: "academic.year_reopened",
            resourceType: "AcademicYear",
            resourceId: year.Id.ToString(),
            summary: $"Año escolar '{year.Name}' ({year.Code}) reabierto."));

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    public async Task<IReadOnlyList<GradeLevelDto>> ListGradeLevelsAsync(
        CancellationToken cancellationToken = default)
    {
        var tenantId = tenantContextAccessor.Current.TenantId;
        if (tenantId is null)
        {
            return [];
        }

        return await dbContext.GradeLevels
            .AsNoTracking()
            .Where(g => g.TenantId == tenantId.Value)
            .OrderBy(g => g.Stage)
            .ThenBy(g => g.OfficialGradeNumber)
            .ThenBy(g => g.Code)
            .Select(g => new GradeLevelDto(
                g.Id,
                g.Stage.ToString(),
                g.OfficialGradeNumber,
                g.Code,
                g.DisplayName,
                dbContext.SchoolSections.Count(s => s.TenantId == tenantId.Value && s.GradeLevelId == g.Id),
                g.CreatedAtUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<Result<GradeLevelDto>> CreateGradeLevelAsync(
        Guid actorUserId,
        CreateGradeLevelCommand command,
        CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;
        if (scope.TenantId is null)
        {
            return Result.Failure<GradeLevelDto>(Error.Forbidden(
                "Tenant.NotResolved",
                "No existe un contexto institucional activo."));
        }

        if (!Enum.TryParse<EducationalStage>(command.Stage, ignoreCase: true, out var stage))
        {
            return Result.Failure<GradeLevelDto>(Error.Validation(
                "GradeLevel.InvalidStage",
                "Nivel educativo inválido. Valores permitidos: EarlyChildhood, Primary, Secondary."));
        }

        var normalizedCode = command.Code.Trim().ToUpperInvariant();
        var exists = await dbContext.GradeLevels
            .AsNoTracking()
            .AnyAsync(g => g.TenantId == scope.TenantId.Value && g.Code == normalizedCode, cancellationToken);

        if (exists)
        {
            return Result.Failure<GradeLevelDto>(Error.Conflict(
                "GradeLevel.DuplicateCode",
                $"Ya existe un grado con el código '{normalizedCode}' en esta institución."));
        }

        var createResult = GradeLevel.Create(
            scope.TenantId.Value,
            stage,
            command.OfficialGradeNumber,
            normalizedCode,
            command.DisplayName);

        if (createResult.IsFailure)
        {
            return Result.Failure<GradeLevelDto>(createResult.Error);
        }

        var grade = createResult.Value;
        dbContext.GradeLevels.Add(grade);
        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: scope.TenantId.Value,
            actorUserId: actorUserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: scope.SupportAccessGrantId,
            action: "academic.grade_level_created",
            resourceType: "GradeLevel",
            resourceId: grade.Id.ToString(),
            summary: $"Grado '{grade.DisplayName}' ({grade.Code}) registrado en nivel {grade.Stage}."));

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(new GradeLevelDto(
            grade.Id,
            grade.Stage.ToString(),
            grade.OfficialGradeNumber,
            grade.Code,
            grade.DisplayName,
            SectionsCount: 0,
            grade.CreatedAtUtc));
    }

    public async Task<IReadOnlyList<SchoolSectionDto>> ListSectionsAsync(
        Guid? academicYearId = null,
        Guid? gradeLevelId = null,
        CancellationToken cancellationToken = default)
    {
        var tenantId = tenantContextAccessor.Current.TenantId;
        if (tenantId is null)
        {
            return [];
        }

        var query = from s in dbContext.SchoolSections.AsNoTracking()
                    join y in dbContext.AcademicYears.AsNoTracking()
                        on new { s.TenantId, Id = s.AcademicYearId } equals new { y.TenantId, y.Id }
                    join g in dbContext.GradeLevels.AsNoTracking()
                        on new { s.TenantId, Id = s.GradeLevelId } equals new { g.TenantId, g.Id }
                    where s.TenantId == tenantId.Value
                    select new
                    {
                        Section = s,
                        YearCode = y.Code,
                        GradeCode = g.Code,
                        GradeName = g.DisplayName,
                        GradeStage = g.Stage,
                        GradeNumber = g.OfficialGradeNumber
                    };

        if (academicYearId.HasValue)
        {
            query = query.Where(x => x.Section.AcademicYearId == academicYearId.Value);
        }

        if (gradeLevelId.HasValue)
        {
            query = query.Where(x => x.Section.GradeLevelId == gradeLevelId.Value);
        }

        return await query
            .OrderBy(x => x.GradeStage)
            .ThenBy(x => x.GradeNumber)
            .ThenBy(x => x.Section.Code)
            .Select(x => new SchoolSectionDto(
                x.Section.Id,
                x.Section.AcademicYearId,
                x.YearCode,
                x.Section.GradeLevelId,
                x.GradeCode,
                x.GradeName,
                x.Section.Code,
                x.Section.Shift.ToString(),
                x.Section.Capacity,
                dbContext.TeacherAssignments.Count(ta => ta.TenantId == tenantId.Value && ta.SectionId == x.Section.Id),
                x.Section.CreatedAtUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<Result<SchoolSectionDto>> CreateSectionAsync(
        Guid actorUserId,
        CreateSchoolSectionCommand command,
        CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;
        if (scope.TenantId is null)
        {
            return Result.Failure<SchoolSectionDto>(Error.Forbidden(
                "Tenant.NotResolved",
                "No existe un contexto institucional activo."));
        }

        if (!Enum.TryParse<SchoolShift>(command.Shift, ignoreCase: true, out var shift))
        {
            return Result.Failure<SchoolSectionDto>(Error.Validation(
                "Section.InvalidShift",
                "Tanda escolar inválida. Valores permitidos: Morning, Afternoon, FullDay."));
        }

        var academicYear = await dbContext.AcademicYears
            .AsNoTracking()
            .FirstOrDefaultAsync(y => y.TenantId == scope.TenantId.Value && y.Id == command.AcademicYearId, cancellationToken);

        if (academicYear is null)
        {
            return Result.Failure<SchoolSectionDto>(Error.NotFound(
                "AcademicYear.NotFound",
                "El año escolar seleccionado no existe en este colegio."));
        }

        if (academicYear.IsClosed)
        {
            return Result.Failure<SchoolSectionDto>(Error.Conflict(
                "AcademicYear.Closed",
                "No se pueden crear secciones en un año escolar cerrado."));
        }

        var gradeLevel = await dbContext.GradeLevels
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.TenantId == scope.TenantId.Value && g.Id == command.GradeLevelId, cancellationToken);

        if (gradeLevel is null)
        {
            return Result.Failure<SchoolSectionDto>(Error.NotFound(
                "GradeLevel.NotFound",
                "El grado académico seleccionado no existe en este colegio."));
        }

        var normalizedCode = command.Code.Trim().ToUpperInvariant();
        var duplicate = await dbContext.SchoolSections
            .AsNoTracking()
            .AnyAsync(
                s => s.TenantId == scope.TenantId.Value &&
                     s.AcademicYearId == command.AcademicYearId &&
                     s.GradeLevelId == command.GradeLevelId &&
                     s.Code == normalizedCode,
                cancellationToken);

        if (duplicate)
        {
            return Result.Failure<SchoolSectionDto>(Error.Conflict(
                "Section.DuplicateCode",
                $"Ya existe la sección '{normalizedCode}' para el grado {gradeLevel.DisplayName} en el año {academicYear.Code}."));
        }

        var createResult = SchoolSection.Create(
            scope.TenantId.Value,
            command.AcademicYearId,
            command.GradeLevelId,
            normalizedCode,
            shift,
            command.Capacity);

        if (createResult.IsFailure)
        {
            return Result.Failure<SchoolSectionDto>(createResult.Error);
        }

        var section = createResult.Value;
        dbContext.SchoolSections.Add(section);
        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: scope.TenantId.Value,
            actorUserId: actorUserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: scope.SupportAccessGrantId,
            action: "academic.section_created",
            resourceType: "SchoolSection",
            resourceId: section.Id.ToString(),
            summary: $"Sección '{gradeLevel.DisplayName} - {section.Code}' ({section.Shift}, cupo {section.Capacity}) creada en año {academicYear.Code}."));

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(new SchoolSectionDto(
            section.Id,
            section.AcademicYearId,
            academicYear.Code,
            section.GradeLevelId,
            gradeLevel.Code,
            gradeLevel.DisplayName,
            section.Code,
            section.Shift.ToString(),
            section.Capacity,
            AssignedSubjectsCount: 0,
            section.CreatedAtUtc));
    }

    public async Task<IReadOnlyList<SubjectDto>> ListSubjectsAsync(
        CancellationToken cancellationToken = default)
    {
        var tenantId = tenantContextAccessor.Current.TenantId;
        if (tenantId is null)
        {
            return [];
        }

        return await dbContext.Subjects
            .AsNoTracking()
            .Where(sub => sub.TenantId == tenantId.Value)
            .OrderBy(sub => sub.Code)
            .Select(sub => new SubjectDto(
                sub.Id,
                sub.Code,
                sub.Name,
                dbContext.TeacherAssignments.Count(ta => ta.TenantId == tenantId.Value && ta.SubjectId == sub.Id),
                sub.CreatedAtUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<Result<SubjectDto>> CreateSubjectAsync(
        Guid actorUserId,
        CreateSubjectCommand command,
        CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;
        if (scope.TenantId is null)
        {
            return Result.Failure<SubjectDto>(Error.Forbidden(
                "Tenant.NotResolved",
                "No existe un contexto institucional activo."));
        }

        var normalizedCode = command.Code.Trim().ToUpperInvariant();
        var duplicate = await dbContext.Subjects
            .AsNoTracking()
            .AnyAsync(s => s.TenantId == scope.TenantId.Value && s.Code == normalizedCode, cancellationToken);

        if (duplicate)
        {
            return Result.Failure<SubjectDto>(Error.Conflict(
                "Subject.DuplicateCode",
                $"Ya existe una asignatura con el código '{normalizedCode}' en este colegio."));
        }

        var createResult = Subject.Create(scope.TenantId.Value, normalizedCode, command.Name);
        if (createResult.IsFailure)
        {
            return Result.Failure<SubjectDto>(createResult.Error);
        }

        var subject = createResult.Value;
        dbContext.Subjects.Add(subject);
        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: scope.TenantId.Value,
            actorUserId: actorUserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: scope.SupportAccessGrantId,
            action: "academic.subject_created",
            resourceType: "Subject",
            resourceId: subject.Id.ToString(),
            summary: $"Asignatura '{subject.Name}' ({subject.Code}) creada."));

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(new SubjectDto(
            subject.Id,
            subject.Code,
            subject.Name,
            AssignedSectionsCount: 0,
            subject.CreatedAtUtc));
    }

    public async Task<IReadOnlyList<TeacherAssignmentDto>> ListTeacherAssignmentsAsync(
        Guid? academicYearId = null,
        Guid? sectionId = null,
        CancellationToken cancellationToken = default)
    {
        var tenantId = tenantContextAccessor.Current.TenantId;
        if (tenantId is null)
        {
            return [];
        }

        var query = from ta in dbContext.TeacherAssignments.AsNoTracking()
                    join y in dbContext.AcademicYears.AsNoTracking()
                        on new { ta.TenantId, Id = ta.AcademicYearId } equals new { y.TenantId, y.Id }
                    join sec in dbContext.SchoolSections.AsNoTracking()
                        on new { ta.TenantId, Id = ta.SectionId } equals new { sec.TenantId, sec.Id }
                    join g in dbContext.GradeLevels.AsNoTracking()
                        on new { sec.TenantId, Id = sec.GradeLevelId } equals new { g.TenantId, g.Id }
                    join sub in dbContext.Subjects.AsNoTracking()
                        on new { ta.TenantId, Id = ta.SubjectId } equals new { sub.TenantId, sub.Id }
                    join m in dbContext.TenantMemberships.AsNoTracking()
                        on new { ta.TenantId, Id = ta.TeacherMembershipId } equals new { m.TenantId, m.Id }
                    join u in dbContext.Users.AsNoTracking()
                        on m.UserId equals u.Id
                    where ta.TenantId == tenantId.Value
                    select new
                    {
                        Assignment = ta,
                        YearCode = y.Code,
                        SectionCode = sec.Code,
                        GradeName = g.DisplayName,
                        SubjectCode = sub.Code,
                        SubjectName = sub.Name,
                        TeacherName = u.DisplayName,
                        TeacherEmail = u.Email
                    };

        if (academicYearId.HasValue)
        {
            query = query.Where(x => x.Assignment.AcademicYearId == academicYearId.Value);
        }

        if (sectionId.HasValue)
        {
            query = query.Where(x => x.Assignment.SectionId == sectionId.Value);
        }

        return await query
            .OrderBy(x => x.GradeName)
            .ThenBy(x => x.SectionCode)
            .ThenBy(x => x.SubjectCode)
            .Select(x => new TeacherAssignmentDto(
                x.Assignment.Id,
                x.Assignment.AcademicYearId,
                x.YearCode,
                x.Assignment.SectionId,
                x.SectionCode,
                x.GradeName,
                x.Assignment.SubjectId,
                x.SubjectCode,
                x.SubjectName,
                x.Assignment.TeacherMembershipId,
                x.TeacherName,
                x.TeacherEmail,
                x.Assignment.WeeklyHours,
                x.Assignment.CreatedAtUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<Result<TeacherAssignmentDto>> AssignTeacherAsync(
        Guid actorUserId,
        AssignTeacherCommand command,
        CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;
        if (scope.TenantId is null)
        {
            return Result.Failure<TeacherAssignmentDto>(Error.Forbidden(
                "Tenant.NotResolved",
                "No existe un contexto institucional activo."));
        }

        var sectionData = await (
            from sec in dbContext.SchoolSections.AsNoTracking()
            join y in dbContext.AcademicYears.AsNoTracking()
                on new { sec.TenantId, Id = sec.AcademicYearId } equals new { y.TenantId, y.Id }
            join g in dbContext.GradeLevels.AsNoTracking()
                on new { sec.TenantId, Id = sec.GradeLevelId } equals new { g.TenantId, g.Id }
            where sec.TenantId == scope.TenantId.Value && sec.Id == command.SectionId
            select new
            {
                Section = sec,
                Year = y,
                Grade = g
            }).FirstOrDefaultAsync(cancellationToken);

        if (sectionData is null)
        {
            return Result.Failure<TeacherAssignmentDto>(Error.NotFound(
                "Section.NotFound",
                "La sección seleccionada no existe en este colegio."));
        }

        if (sectionData.Year.IsClosed)
        {
            return Result.Failure<TeacherAssignmentDto>(Error.Conflict(
                "AcademicYear.Closed",
                "No se pueden asignar docentes en un año escolar cerrado."));
        }

        var subject = await dbContext.Subjects
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.TenantId == scope.TenantId.Value && s.Id == command.SubjectId, cancellationToken);

        if (subject is null)
        {
            return Result.Failure<TeacherAssignmentDto>(Error.NotFound(
                "Subject.NotFound",
                "La asignatura seleccionada no existe en este colegio."));
        }

        var teacherData = await (
            from m in dbContext.TenantMemberships.AsNoTracking()
            join u in dbContext.Users.AsNoTracking() on m.UserId equals u.Id
            where m.TenantId == scope.TenantId.Value && m.Id == command.TeacherMembershipId
            select new
            {
                Membership = m,
                User = u
            }).FirstOrDefaultAsync(cancellationToken);

        if (teacherData is null || teacherData.Membership.Status != MembershipStatus.Active)
        {
            return Result.Failure<TeacherAssignmentDto>(Error.Validation(
                "TeacherAssignment.InactiveOrMissingMember",
                "El docente seleccionado no posee una membresía activa en esta institución."));
        }

        var duplicate = await dbContext.TeacherAssignments
            .AsNoTracking()
            .AnyAsync(
                ta => ta.TenantId == scope.TenantId.Value &&
                      ta.SectionId == command.SectionId &&
                      ta.SubjectId == command.SubjectId,
                cancellationToken);

        if (duplicate)
        {
            return Result.Failure<TeacherAssignmentDto>(Error.Conflict(
                "TeacherAssignment.Duplicate",
                $"La asignatura '{subject.Name}' ya tiene un docente asignado en la sección {sectionData.Grade.DisplayName} - {sectionData.Section.Code}."));
        }

        var createResult = TeacherAssignment.Create(
            scope.TenantId.Value,
            sectionData.Year.Id,
            command.SectionId,
            command.SubjectId,
            command.TeacherMembershipId,
            command.WeeklyHours);

        if (createResult.IsFailure)
        {
            return Result.Failure<TeacherAssignmentDto>(createResult.Error);
        }

        var assignment = createResult.Value;
        dbContext.TeacherAssignments.Add(assignment);
        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: scope.TenantId.Value,
            actorUserId: actorUserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: scope.SupportAccessGrantId,
            action: "academic.teacher_assigned",
            resourceType: "TeacherAssignment",
            resourceId: assignment.Id.ToString(),
            summary: $"Docente {teacherData.User.Email} asignado a {subject.Code} en sección {sectionData.Grade.Code}-{sectionData.Section.Code} ({assignment.WeeklyHours}h/sem)."));

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(new TeacherAssignmentDto(
            assignment.Id,
            sectionData.Year.Id,
            sectionData.Year.Code,
            sectionData.Section.Id,
            sectionData.Section.Code,
            sectionData.Grade.DisplayName,
            subject.Id,
            subject.Code,
            subject.Name,
            teacherData.Membership.Id,
            teacherData.User.DisplayName,
            teacherData.User.Email,
            assignment.WeeklyHours,
            assignment.CreatedAtUtc));
    }
}
