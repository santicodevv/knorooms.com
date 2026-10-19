using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Audit.Domain;
using Knorooms.Modules.Modules.Enrollments.Contracts;
using Knorooms.Modules.Modules.Enrollments.Domain;
using Knorooms.SharedKernel.Results;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace Knorooms.Modules.Modules.Enrollments.Application;

internal sealed class StudentEnrollmentService(
    ApplicationDbContext dbContext,
    ITenantContextAccessor tenantContextAccessor) : IStudentEnrollmentService
{
    public async Task<EnrollmentsOverviewDto> GetOverviewAsync(
        Guid? academicYearId = null,
        Guid? sectionId = null,
        CancellationToken cancellationToken = default)
    {
        var enrollments = await ListEnrollmentsAsync(academicYearId, sectionId, cancellationToken);
        var sectionCapacities = await ListSectionCapacitiesAsync(academicYearId, cancellationToken);

        return new EnrollmentsOverviewDto(enrollments, sectionCapacities);
    }

    public async Task<IReadOnlyList<StudentEnrollmentDto>> ListEnrollmentsAsync(
        Guid? academicYearId = null,
        Guid? sectionId = null,
        CancellationToken cancellationToken = default)
    {
        var tenantId = tenantContextAccessor.Current.TenantId;
        if (tenantId is null || tenantId == Guid.Empty)
        {
            return [];
        }

        var query =
            from enrollment in dbContext.StudentEnrollments.AsNoTracking()
            join student in dbContext.Students.AsNoTracking()
                on new { enrollment.TenantId, Id = enrollment.StudentId } equals new { student.TenantId, student.Id }
            join year in dbContext.AcademicYears.AsNoTracking()
                on new { enrollment.TenantId, Id = enrollment.AcademicYearId } equals new { year.TenantId, year.Id }
            join section in dbContext.SchoolSections.AsNoTracking()
                on new { enrollment.TenantId, Id = enrollment.SectionId } equals new { section.TenantId, section.Id }
            join grade in dbContext.GradeLevels.AsNoTracking()
                on new { section.TenantId, Id = section.GradeLevelId } equals new { grade.TenantId, grade.Id }
            where enrollment.TenantId == tenantId.Value
            select new
            {
                enrollment,
                student,
                year,
                section,
                grade
            };

        if (academicYearId.HasValue && academicYearId.Value != Guid.Empty)
        {
            query = query.Where(x => x.enrollment.AcademicYearId == academicYearId.Value);
        }

        if (sectionId.HasValue && sectionId.Value != Guid.Empty)
        {
            query = query.Where(x => x.enrollment.SectionId == sectionId.Value);
        }

        var items = await query
            .OrderByDescending(x => x.year.StartDate)
            .ThenBy(x => x.grade.OfficialGradeNumber)
            .ThenBy(x => x.section.Code)
            .ThenBy(x => x.student.LastName)
            .ThenBy(x => x.student.FirstName)
            .ToListAsync(cancellationToken);

        return items
            .Select(x => new StudentEnrollmentDto(
                x.enrollment.Id,
                x.student.Id,
                x.student.StudentCode,
                $"{x.student.FirstName} {x.student.LastName}",
                x.student.SigerdExternalId,
                x.year.Id,
                x.year.Code,
                x.section.Id,
                x.section.Code,
                x.grade.Code,
                x.grade.DisplayName,
                x.section.Shift.ToString(),
                x.enrollment.Status.ToString(),
                x.enrollment.EnrolledAtUtc))
            .ToList();
    }

    public async Task<Result<StudentEnrollmentDto>> EnrollStudentAsync(
        Guid actorUserId,
        EnrollStudentCommand command,
        CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;
        if (scope.TenantId is null || scope.TenantId == Guid.Empty)
        {
            return Result.Failure<StudentEnrollmentDto>(Error.Forbidden(
                "Tenant.ContextRequired",
                "Esta operación requiere un contexto institucional activo."));
        }

        var tenantId = scope.TenantId.Value;

        var student = await dbContext.Students
            .AsNoTracking()
            .SingleOrDefaultAsync(s => s.TenantId == tenantId && s.Id == command.StudentId, cancellationToken);

        if (student is null)
        {
            return Result.Failure<StudentEnrollmentDto>(Error.NotFound(
                "Student.NotFound",
                "El expediente estudiantil seleccionado no existe en esta institución."));
        }

        if (!student.IsActive)
        {
            return Result.Failure<StudentEnrollmentDto>(Error.Conflict(
                "Student.Inactive",
                "No se puede matricular un expediente estudiantil que se encuentra inactivo."));
        }

        var sectionContext = await (
            from section in dbContext.SchoolSections.AsNoTracking()
            join year in dbContext.AcademicYears.AsNoTracking()
                on new { section.TenantId, Id = section.AcademicYearId } equals new { year.TenantId, year.Id }
            join grade in dbContext.GradeLevels.AsNoTracking()
                on new { section.TenantId, Id = section.GradeLevelId } equals new { grade.TenantId, grade.Id }
            where section.TenantId == tenantId && section.Id == command.SectionId
            select new { section, year, grade })
            .SingleOrDefaultAsync(cancellationToken);

        if (sectionContext is null)
        {
            return Result.Failure<StudentEnrollmentDto>(Error.NotFound(
                "Section.NotFound",
                "La sección seleccionada no existe en esta institución."));
        }

        if (sectionContext.year.IsClosed)
        {
            return Result.Failure<StudentEnrollmentDto>(Error.Conflict(
                "AcademicYear.Closed",
                "No se pueden registrar matrículas en un año escolar cerrado."));
        }

        var alreadyEnrolledInYear = await dbContext.StudentEnrollments
            .AnyAsync(
                e => e.TenantId == tenantId &&
                     e.StudentId == command.StudentId &&
                     e.AcademicYearId == sectionContext.year.Id,
                cancellationToken);

        if (alreadyEnrolledInYear)
        {
            return Result.Failure<StudentEnrollmentDto>(Error.Conflict(
                "Enrollment.DuplicateForYear",
                $"El estudiante ya cuenta con una matrícula registrada en el año escolar {sectionContext.year.Code}."));
        }

        var activeEnrollmentsInSection = await dbContext.StudentEnrollments
            .CountAsync(
                e => e.TenantId == tenantId &&
                     e.SectionId == sectionContext.section.Id &&
                     e.Status == EnrollmentStatus.Active,
                cancellationToken);

        if (activeEnrollmentsInSection >= sectionContext.section.Capacity)
        {
            return Result.Failure<StudentEnrollmentDto>(Error.Conflict(
                "Enrollment.SectionCapacityExceeded",
                $"La sección {sectionContext.grade.Code}-{sectionContext.section.Code} ha alcanzado su capacidad máxima autorizada de {sectionContext.section.Capacity} cupos."));
        }

        var enrollmentResult = StudentEnrollment.Create(
            tenantId,
            student.Id,
            sectionContext.year.Id,
            sectionContext.section.Id);

        if (enrollmentResult.IsFailure)
        {
            return Result.Failure<StudentEnrollmentDto>(enrollmentResult.Error);
        }

        var enrollment = enrollmentResult.Value;
        dbContext.StudentEnrollments.Add(enrollment);

        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: tenantId,
            actorUserId: actorUserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: scope.SupportAccessGrantId,
            action: "enrollment.created",
            resourceType: nameof(StudentEnrollment),
            resourceId: enrollment.Id.ToString(),
            summary: $"Estudiante '{student.StudentCode}' matriculado en {sectionContext.grade.Code}-{sectionContext.section.Code} (Año {sectionContext.year.Code})."));

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(new StudentEnrollmentDto(
            enrollment.Id,
            student.Id,
            student.StudentCode,
            $"{student.FirstName} {student.LastName}",
            student.SigerdExternalId,
            sectionContext.year.Id,
            sectionContext.year.Code,
            sectionContext.section.Id,
            sectionContext.section.Code,
            sectionContext.grade.Code,
            sectionContext.grade.DisplayName,
            sectionContext.section.Shift.ToString(),
            enrollment.Status.ToString(),
            enrollment.EnrolledAtUtc));
    }

    public async Task<Result<StudentEnrollmentDto>> TransferSectionAsync(
        Guid actorUserId,
        TransferStudentSectionCommand command,
        CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;
        if (scope.TenantId is null || scope.TenantId == Guid.Empty)
        {
            return Result.Failure<StudentEnrollmentDto>(Error.Forbidden(
                "Tenant.ContextRequired",
                "Esta operación requiere un contexto institucional activo."));
        }

        var tenantId = scope.TenantId.Value;

        var enrollment = await dbContext.StudentEnrollments
            .SingleOrDefaultAsync(e => e.TenantId == tenantId && e.Id == command.EnrollmentId, cancellationToken);

        if (enrollment is null)
        {
            return Result.Failure<StudentEnrollmentDto>(Error.NotFound(
                "Enrollment.NotFound",
                "La matrícula indicada no existe en esta institución."));
        }

        var targetContext = await (
            from section in dbContext.SchoolSections.AsNoTracking()
            join year in dbContext.AcademicYears.AsNoTracking()
                on new { section.TenantId, Id = section.AcademicYearId } equals new { year.TenantId, year.Id }
            join grade in dbContext.GradeLevels.AsNoTracking()
                on new { section.TenantId, Id = section.GradeLevelId } equals new { grade.TenantId, grade.Id }
            where section.TenantId == tenantId && section.Id == command.TargetSectionId
            select new { section, year, grade })
            .SingleOrDefaultAsync(cancellationToken);

        if (targetContext is null)
        {
            return Result.Failure<StudentEnrollmentDto>(Error.NotFound(
                "Section.NotFound",
                "La sección de destino no existe en esta institución."));
        }

        if (targetContext.year.Id != enrollment.AcademicYearId)
        {
            return Result.Failure<StudentEnrollmentDto>(Error.Validation(
                "Enrollment.CrossYearTransferNotAllowed",
                "El cambio de sección debe realizarse dentro del mismo año escolar de la matrícula."));
        }

        if (targetContext.year.IsClosed)
        {
            return Result.Failure<StudentEnrollmentDto>(Error.Conflict(
                "AcademicYear.Closed",
                "No se pueden trasladar estudiantes en un año escolar cerrado."));
        }

        var activeInTarget = await dbContext.StudentEnrollments
            .CountAsync(
                e => e.TenantId == tenantId &&
                     e.SectionId == targetContext.section.Id &&
                     e.Status == EnrollmentStatus.Active,
                cancellationToken);

        if (activeInTarget >= targetContext.section.Capacity)
        {
            return Result.Failure<StudentEnrollmentDto>(Error.Conflict(
                "Enrollment.SectionCapacityExceeded",
                $"La sección de destino {targetContext.grade.Code}-{targetContext.section.Code} ha alcanzado su capacidad máxima de {targetContext.section.Capacity} cupos."));
        }

        var transferResult = enrollment.TransferToSection(targetContext.section.Id);
        if (transferResult.IsFailure)
        {
            return Result.Failure<StudentEnrollmentDto>(transferResult.Error);
        }

        var student = await dbContext.Students
            .AsNoTracking()
            .SingleAsync(s => s.TenantId == tenantId && s.Id == enrollment.StudentId, cancellationToken);

        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: tenantId,
            actorUserId: actorUserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: scope.SupportAccessGrantId,
            action: "enrollment.transferred",
            resourceType: nameof(StudentEnrollment),
            resourceId: enrollment.Id.ToString(),
            summary: $"Estudiante '{student.StudentCode}' trasladado a la sección {targetContext.grade.Code}-{targetContext.section.Code}."));

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(new StudentEnrollmentDto(
            enrollment.Id,
            student.Id,
            student.StudentCode,
            $"{student.FirstName} {student.LastName}",
            student.SigerdExternalId,
            targetContext.year.Id,
            targetContext.year.Code,
            targetContext.section.Id,
            targetContext.section.Code,
            targetContext.grade.Code,
            targetContext.grade.DisplayName,
            targetContext.section.Shift.ToString(),
            enrollment.Status.ToString(),
            enrollment.EnrolledAtUtc));
    }

    public async Task<Result> WithdrawEnrollmentAsync(
        Guid actorUserId,
        Guid enrollmentId,
        CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;
        if (scope.TenantId is null || scope.TenantId == Guid.Empty)
        {
            return Result.Failure(Error.Forbidden(
                "Tenant.ContextRequired",
                "Esta operación requiere un contexto institucional activo."));
        }

        var tenantId = scope.TenantId.Value;

        var enrollment = await dbContext.StudentEnrollments
            .SingleOrDefaultAsync(e => e.TenantId == tenantId && e.Id == enrollmentId, cancellationToken);

        if (enrollment is null)
        {
            return Result.Failure(Error.NotFound(
                "Enrollment.NotFound",
                "La matrícula indicada no existe en esta institución."));
        }

        var withdrawResult = enrollment.Withdraw();
        if (withdrawResult.IsFailure)
        {
            return withdrawResult;
        }

        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: tenantId,
            actorUserId: actorUserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: scope.SupportAccessGrantId,
            action: "enrollment.withdrawn",
            resourceType: nameof(StudentEnrollment),
            resourceId: enrollment.Id.ToString(),
            summary: $"Matrícula '{enrollment.Id}' retirada del período lectivo."));

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    private async Task<IReadOnlyList<SectionCapacitySnapshotDto>> ListSectionCapacitiesAsync(
        Guid? academicYearId,
        CancellationToken cancellationToken)
    {
        var tenantId = tenantContextAccessor.Current.TenantId;
        if (tenantId is null || tenantId == Guid.Empty)
        {
            return [];
        }

        var sectionsQuery =
            from section in dbContext.SchoolSections.AsNoTracking()
            join year in dbContext.AcademicYears.AsNoTracking()
                on new { section.TenantId, Id = section.AcademicYearId } equals new { year.TenantId, year.Id }
            join grade in dbContext.GradeLevels.AsNoTracking()
                on new { section.TenantId, Id = section.GradeLevelId } equals new { grade.TenantId, grade.Id }
            where section.TenantId == tenantId.Value
            select new { section, year, grade };

        if (academicYearId.HasValue && academicYearId.Value != Guid.Empty)
        {
            sectionsQuery = sectionsQuery.Where(x => x.section.AcademicYearId == academicYearId.Value);
        }

        var sections = await sectionsQuery
            .OrderByDescending(x => x.year.StartDate)
            .ThenBy(x => x.grade.OfficialGradeNumber)
            .ThenBy(x => x.section.Code)
            .ToListAsync(cancellationToken);

        var activeCounts = await dbContext.StudentEnrollments
            .AsNoTracking()
            .Where(e => e.TenantId == tenantId.Value && e.Status == EnrollmentStatus.Active)
            .GroupBy(e => e.SectionId)
            .Select(g => new { SectionId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.SectionId, x => x.Count, cancellationToken);

        return sections
            .Select(x =>
            {
                var active = activeCounts.GetValueOrDefault(x.section.Id, 0);
                var available = Math.Max(0, x.section.Capacity - active);
                return new SectionCapacitySnapshotDto(
                    x.section.Id,
                    x.year.Id,
                    x.year.Code,
                    x.year.IsClosed,
                    x.grade.Id,
                    x.grade.Code,
                    x.grade.DisplayName,
                    x.section.Code,
                    x.section.Shift.ToString(),
                    x.section.Capacity,
                    active,
                    available);
            })
            .ToList();
    }
}
