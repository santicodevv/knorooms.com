using Knorooms.SharedKernel.Domain;
using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.Students.Domain;

/// <summary>
/// Expediente permanente del estudiante dentro de una institución educativa.
/// No se duplica por cada año escolar; las matrículas anuales referencian este expediente.
/// </summary>
public sealed class StudentRecord : TenantScopedEntity
{
    public string StudentCode { get; private set; } = string.Empty;

    public string FirstName { get; private set; } = string.Empty;

    public string LastName { get; private set; } = string.Empty;

    public DateOnly BirthDate { get; private set; }

    public string? SigerdExternalId { get; private set; }

    public bool IsActive { get; private set; } = true;

    private StudentRecord()
    {
    }

    public static Result<StudentRecord> Create(
        Guid tenantId,
        string studentCode,
        string firstName,
        string lastName,
        DateOnly birthDate,
        string? sigerdExternalId = null)
    {
        if (tenantId == Guid.Empty)
        {
            return Result.Failure<StudentRecord>(Error.Validation("Student.InvalidTenant", "TenantId is required."));
        }

        if (string.IsNullOrWhiteSpace(studentCode) || studentCode.Trim().Length > 32)
        {
            return Result.Failure<StudentRecord>(Error.Validation("Student.InvalidCode", "El código de expediente estudiantil es obligatorio (máx. 32 caracteres)."));
        }

        if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName))
        {
            return Result.Failure<StudentRecord>(Error.Validation("Student.InvalidName", "Nombre y apellidos del estudiante son obligatorios."));
        }

        return Result.Success(new StudentRecord
        {
            Id = Guid.CreateVersion7(),
            TenantId = tenantId,
            StudentCode = studentCode.Trim().ToUpperInvariant(),
            FirstName = firstName.Trim(),
            LastName = lastName.Trim(),
            BirthDate = birthDate,
            SigerdExternalId = string.IsNullOrWhiteSpace(sigerdExternalId) ? null : sigerdExternalId.Trim(),
            IsActive = true
        });
    }
}

/// <summary>
/// Responsable o tutor familiar registrado en el colegio.
/// </summary>
public sealed class Guardian : TenantScopedEntity
{
    public string FullName { get; private set; } = string.Empty;

    public string Email { get; private set; } = string.Empty;

    public string? PhoneNumber { get; private set; }

    public Guid? UserAccountId { get; private set; }

    private Guardian()
    {
    }

    public static Result<Guardian> Create(
        Guid tenantId,
        string fullName,
        string email,
        string? phoneNumber = null,
        Guid? userAccountId = null)
    {
        if (tenantId == Guid.Empty)
        {
            return Result.Failure<Guardian>(Error.Validation("Guardian.InvalidTenant", "TenantId is required."));
        }

        if (string.IsNullOrWhiteSpace(fullName))
        {
            return Result.Failure<Guardian>(Error.Validation("Guardian.InvalidName", "El nombre del responsable es obligatorio."));
        }

        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@', StringComparison.Ordinal))
        {
            return Result.Failure<Guardian>(Error.Validation("Guardian.InvalidEmail", "El correo del responsable es obligatorio."));
        }

        return Result.Success(new Guardian
        {
            Id = Guid.CreateVersion7(),
            TenantId = tenantId,
            FullName = fullName.Trim(),
            Email = email.Trim().ToLowerInvariant(),
            PhoneNumber = string.IsNullOrWhiteSpace(phoneNumber) ? null : phoneNumber.Trim(),
            UserAccountId = userAccountId
        });
    }
}

/// <summary>
/// Vínculo familiar granular entre responsable y estudiante (seguimiento académico, responsabilidad de pago, recogida).
/// </summary>
public sealed class StudentGuardianLink : TenantScopedEntity
{
    public Guid StudentId { get; private set; }

    public Guid GuardianId { get; private set; }

    public string RelationshipType { get; private set; } = string.Empty;

    public bool HasAcademicAccess { get; private set; }

    public bool HasFinancialResponsibility { get; private set; }

    public bool HasPickupAuthorization { get; private set; }

    private StudentGuardianLink()
    {
    }

    public static Result<StudentGuardianLink> Create(
        Guid tenantId,
        Guid studentId,
        Guid guardianId,
        string relationshipType,
        bool hasAcademicAccess,
        bool hasFinancialResponsibility,
        bool hasPickupAuthorization)
    {
        if (tenantId == Guid.Empty || studentId == Guid.Empty || guardianId == Guid.Empty)
        {
            return Result.Failure<StudentGuardianLink>(Error.Validation("StudentGuardian.InvalidIds", "TenantId, StudentId y GuardianId son obligatorios."));
        }

        if (string.IsNullOrWhiteSpace(relationshipType))
        {
            return Result.Failure<StudentGuardianLink>(Error.Validation("StudentGuardian.InvalidRelationship", "El parentesco o tipo de vínculo es obligatorio."));
        }

        return Result.Success(new StudentGuardianLink
        {
            Id = Guid.CreateVersion7(),
            TenantId = tenantId,
            StudentId = studentId,
            GuardianId = guardianId,
            RelationshipType = relationshipType.Trim(),
            HasAcademicAccess = hasAcademicAccess,
            HasFinancialResponsibility = hasFinancialResponsibility,
            HasPickupAuthorization = hasPickupAuthorization
        });
    }
}
