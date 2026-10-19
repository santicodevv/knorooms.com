using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Audit.Domain;
using Knorooms.Modules.Modules.Students.Contracts;
using Knorooms.Modules.Modules.Students.Domain;
using Knorooms.SharedKernel.Results;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace Knorooms.Modules.Modules.Students.Application;

internal sealed class StudentDirectoryService(
    ApplicationDbContext dbContext,
    ITenantContextAccessor tenantContextAccessor) : IStudentDirectoryService
{
    public async Task<StudentDirectoryOverviewDto> GetOverviewAsync(
        CancellationToken cancellationToken = default)
    {
        var students = await ListStudentsAsync(cancellationToken);
        var guardians = await ListGuardiansAsync(cancellationToken);

        return new StudentDirectoryOverviewDto(students, guardians);
    }

    public async Task<IReadOnlyList<StudentDto>> ListStudentsAsync(
        CancellationToken cancellationToken = default)
    {
        var tenantId = tenantContextAccessor.Current.TenantId;
        if (tenantId is null || tenantId == Guid.Empty)
        {
            return [];
        }

        var students = await dbContext.Students
            .AsNoTracking()
            .Where(s => s.TenantId == tenantId.Value)
            .OrderBy(s => s.LastName)
            .ThenBy(s => s.FirstName)
            .ToListAsync(cancellationToken);

        if (students.Count == 0)
        {
            return [];
        }

        var links = await (
            from link in dbContext.StudentGuardianLinks.AsNoTracking()
            join guardian in dbContext.Guardians.AsNoTracking()
                on new { link.TenantId, Id = link.GuardianId } equals new { guardian.TenantId, guardian.Id }
            where link.TenantId == tenantId.Value
            orderby guardian.FullName
            select new
            {
                link.StudentId,
                Dto = new StudentGuardianSummaryDto(
                    link.Id,
                    guardian.Id,
                    guardian.FullName,
                    guardian.Email,
                    guardian.PhoneNumber,
                    link.RelationshipType,
                    link.HasAcademicAccess,
                    link.HasFinancialResponsibility,
                    link.HasPickupAuthorization)
            }).ToListAsync(cancellationToken);

        var linksByStudent = links
            .GroupBy(x => x.StudentId)
            .ToDictionary(g => g.Key, g => (IReadOnlyList<StudentGuardianSummaryDto>)g.Select(x => x.Dto).ToList());

        var enrollments = await (
            from enrollment in dbContext.StudentEnrollments.AsNoTracking()
            join year in dbContext.AcademicYears.AsNoTracking()
                on new { enrollment.TenantId, Id = enrollment.AcademicYearId } equals new { year.TenantId, year.Id }
            join section in dbContext.SchoolSections.AsNoTracking()
                on new { enrollment.TenantId, Id = enrollment.SectionId } equals new { section.TenantId, section.Id }
            join grade in dbContext.GradeLevels.AsNoTracking()
                on new { section.TenantId, Id = section.GradeLevelId } equals new { grade.TenantId, grade.Id }
            where enrollment.TenantId == tenantId.Value
            orderby year.StartDate descending, enrollment.EnrolledAtUtc descending
            select new
            {
                enrollment.StudentId,
                Dto = new StudentEnrollmentSummaryDto(
                    enrollment.Id,
                    year.Id,
                    year.Code,
                    section.Id,
                    section.Code,
                    grade.Code,
                    grade.DisplayName,
                    enrollment.Status.ToString())
            }).ToListAsync(cancellationToken);

        var latestEnrollmentByStudent = enrollments
            .GroupBy(x => x.StudentId)
            .ToDictionary(g => g.Key, g => g.First().Dto);

        return students
            .Select(s => new StudentDto(
                s.Id,
                s.StudentCode,
                s.FirstName,
                s.LastName,
                $"{s.FirstName} {s.LastName}",
                s.BirthDate,
                s.SigerdExternalId,
                s.IsActive,
                linksByStudent.GetValueOrDefault(s.Id, []),
                latestEnrollmentByStudent.GetValueOrDefault(s.Id),
                s.CreatedAtUtc))
            .ToList();
    }

    public async Task<Result<StudentDto>> CreateStudentAsync(
        Guid actorUserId,
        CreateStudentCommand command,
        CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;
        if (scope.TenantId is null || scope.TenantId == Guid.Empty)
        {
            return Result.Failure<StudentDto>(Error.Forbidden(
                "Tenant.ContextRequired",
                "Esta operación requiere un contexto institucional activo."));
        }

        var tenantId = scope.TenantId.Value;
        var normalizedCode = command.StudentCode.Trim().ToUpperInvariant();

        var codeExists = await dbContext.Students
            .AnyAsync(s => s.TenantId == tenantId && s.StudentCode == normalizedCode, cancellationToken);

        if (codeExists)
        {
            return Result.Failure<StudentDto>(Error.Conflict(
                "Student.DuplicateCode",
                $"Ya existe un expediente estudiantil con la matrícula/código '{normalizedCode}' en esta institución."));
        }

        var studentResult = StudentRecord.Create(
            tenantId,
            normalizedCode,
            command.FirstName,
            command.LastName,
            command.BirthDate,
            command.SigerdExternalId);

        if (studentResult.IsFailure)
        {
            return Result.Failure<StudentDto>(studentResult.Error);
        }

        var student = studentResult.Value;
        dbContext.Students.Add(student);

        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: tenantId,
            actorUserId: actorUserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: scope.SupportAccessGrantId,
            action: "student.created",
            resourceType: nameof(StudentRecord),
            resourceId: student.Id.ToString(),
            summary: $"Expediente estudiantil '{student.FirstName} {student.LastName}' ({student.StudentCode}) registrado."));

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(new StudentDto(
            student.Id,
            student.StudentCode,
            student.FirstName,
            student.LastName,
            $"{student.FirstName} {student.LastName}",
            student.BirthDate,
            student.SigerdExternalId,
            student.IsActive,
            [],
            null,
            student.CreatedAtUtc));
    }

    public async Task<Result> DeactivateStudentAsync(
        Guid actorUserId,
        Guid studentId,
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
        var student = await dbContext.Students
            .SingleOrDefaultAsync(s => s.TenantId == tenantId && s.Id == studentId, cancellationToken);

        if (student is null)
        {
            return Result.Failure(Error.NotFound(
                "Student.NotFound",
                "El expediente estudiantil solicitado no existe en esta institución."));
        }

        var deactivateResult = student.Deactivate();
        if (deactivateResult.IsFailure)
        {
            return deactivateResult;
        }

        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: tenantId,
            actorUserId: actorUserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: scope.SupportAccessGrantId,
            action: "student.deactivated",
            resourceType: nameof(StudentRecord),
            resourceId: student.Id.ToString(),
            summary: $"Expediente estudiantil '{student.StudentCode}' desactivado."));

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    public async Task<Result> ActivateStudentAsync(
        Guid actorUserId,
        Guid studentId,
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
        var student = await dbContext.Students
            .SingleOrDefaultAsync(s => s.TenantId == tenantId && s.Id == studentId, cancellationToken);

        if (student is null)
        {
            return Result.Failure(Error.NotFound(
                "Student.NotFound",
                "El expediente estudiantil solicitado no existe en esta institución."));
        }

        var activateResult = student.Activate();
        if (activateResult.IsFailure)
        {
            return activateResult;
        }

        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: tenantId,
            actorUserId: actorUserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: scope.SupportAccessGrantId,
            action: "student.activated",
            resourceType: nameof(StudentRecord),
            resourceId: student.Id.ToString(),
            summary: $"Expediente estudiantil '{student.StudentCode}' reactivado."));

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    public async Task<IReadOnlyList<GuardianDto>> ListGuardiansAsync(
        CancellationToken cancellationToken = default)
    {
        var tenantId = tenantContextAccessor.Current.TenantId;
        if (tenantId is null || tenantId == Guid.Empty)
        {
            return [];
        }

        var guardians = await dbContext.Guardians
            .AsNoTracking()
            .Where(g => g.TenantId == tenantId.Value)
            .OrderBy(g => g.FullName)
            .ToListAsync(cancellationToken);

        var linkCounts = await dbContext.StudentGuardianLinks
            .AsNoTracking()
            .Where(l => l.TenantId == tenantId.Value)
            .GroupBy(l => l.GuardianId)
            .Select(g => new { GuardianId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.GuardianId, x => x.Count, cancellationToken);

        return guardians
            .Select(g => new GuardianDto(
                g.Id,
                g.FullName,
                g.Email,
                g.PhoneNumber,
                g.UserAccountId,
                linkCounts.GetValueOrDefault(g.Id, 0),
                g.CreatedAtUtc))
            .ToList();
    }

    public async Task<Result<GuardianDto>> CreateGuardianAsync(
        Guid actorUserId,
        CreateGuardianCommand command,
        CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;
        if (scope.TenantId is null || scope.TenantId == Guid.Empty)
        {
            return Result.Failure<GuardianDto>(Error.Forbidden(
                "Tenant.ContextRequired",
                "Esta operación requiere un contexto institucional activo."));
        }

        var tenantId = scope.TenantId.Value;
        var normalizedEmail = command.Email.Trim().ToLowerInvariant();

        var emailExists = await dbContext.Guardians
            .AnyAsync(g => g.TenantId == tenantId && g.Email == normalizedEmail, cancellationToken);

        if (emailExists)
        {
            return Result.Failure<GuardianDto>(Error.Conflict(
                "Guardian.DuplicateEmail",
                $"Ya existe un responsable familiar registrado con el correo '{normalizedEmail}' en esta institución."));
        }

        var existingUserAccount = await dbContext.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);

        var guardianResult = Guardian.Create(
            tenantId,
            command.FullName,
            normalizedEmail,
            command.PhoneNumber,
            existingUserAccount?.Id);

        if (guardianResult.IsFailure)
        {
            return Result.Failure<GuardianDto>(guardianResult.Error);
        }

        var guardian = guardianResult.Value;
        dbContext.Guardians.Add(guardian);

        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: tenantId,
            actorUserId: actorUserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: scope.SupportAccessGrantId,
            action: "guardian.created",
            resourceType: nameof(Guardian),
            resourceId: guardian.Id.ToString(),
            summary: $"Responsable familiar '{guardian.FullName}' ({guardian.Email}) registrado."));

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(new GuardianDto(
            guardian.Id,
            guardian.FullName,
            guardian.Email,
            guardian.PhoneNumber,
            guardian.UserAccountId,
            0,
            guardian.CreatedAtUtc));
    }

    public async Task<Result<StudentGuardianSummaryDto>> LinkGuardianAsync(
        Guid actorUserId,
        LinkStudentGuardianCommand command,
        CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;
        if (scope.TenantId is null || scope.TenantId == Guid.Empty)
        {
            return Result.Failure<StudentGuardianSummaryDto>(Error.Forbidden(
                "Tenant.ContextRequired",
                "Esta operación requiere un contexto institucional activo."));
        }

        var tenantId = scope.TenantId.Value;

        var student = await dbContext.Students
            .AsNoTracking()
            .SingleOrDefaultAsync(s => s.TenantId == tenantId && s.Id == command.StudentId, cancellationToken);

        if (student is null)
        {
            return Result.Failure<StudentGuardianSummaryDto>(Error.NotFound(
                "Student.NotFound",
                "El estudiante seleccionado no existe en esta institución."));
        }

        var guardian = await dbContext.Guardians
            .AsNoTracking()
            .SingleOrDefaultAsync(g => g.TenantId == tenantId && g.Id == command.GuardianId, cancellationToken);

        if (guardian is null)
        {
            return Result.Failure<StudentGuardianSummaryDto>(Error.NotFound(
                "Guardian.NotFound",
                "El responsable familiar seleccionado no existe en esta institución."));
        }

        var alreadyLinked = await dbContext.StudentGuardianLinks
            .AnyAsync(
                l => l.TenantId == tenantId &&
                     l.StudentId == command.StudentId &&
                     l.GuardianId == command.GuardianId,
                cancellationToken);

        if (alreadyLinked)
        {
            return Result.Failure<StudentGuardianSummaryDto>(Error.Conflict(
                "StudentGuardian.DuplicateLink",
                "Este responsable familiar ya se encuentra vinculado al estudiante."));
        }

        var linkResult = StudentGuardianLink.Create(
            tenantId,
            command.StudentId,
            command.GuardianId,
            command.RelationshipType,
            command.HasAcademicAccess,
            command.HasFinancialResponsibility,
            command.HasPickupAuthorization);

        if (linkResult.IsFailure)
        {
            return Result.Failure<StudentGuardianSummaryDto>(linkResult.Error);
        }

        var link = linkResult.Value;
        dbContext.StudentGuardianLinks.Add(link);

        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: tenantId,
            actorUserId: actorUserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: scope.SupportAccessGrantId,
            action: "student.guardian_linked",
            resourceType: nameof(StudentGuardianLink),
            resourceId: link.Id.ToString(),
            summary: $"Responsable '{guardian.FullName}' vinculado al estudiante '{student.StudentCode}' como {link.RelationshipType}."));

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(new StudentGuardianSummaryDto(
            link.Id,
            guardian.Id,
            guardian.FullName,
            guardian.Email,
            guardian.PhoneNumber,
            link.RelationshipType,
            link.HasAcademicAccess,
            link.HasFinancialResponsibility,
            link.HasPickupAuthorization));
    }
}
