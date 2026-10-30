using Knorooms.Modules.Modules.Academic.Domain;
using Knorooms.Modules.Modules.Attendance.Domain;
using Knorooms.Modules.Modules.Audit.Domain;
using Knorooms.Modules.Modules.Authorization.Domain;
using Knorooms.Modules.Modules.Enrollments.Domain;
using Knorooms.Modules.Modules.Entitlements.Domain;
using Knorooms.Modules.Modules.Grading.Domain;
using Knorooms.Modules.Modules.Identity.Domain;
using Knorooms.Modules.Modules.Platform.Domain;
using Knorooms.Modules.Modules.ReportCards.Domain;
using Knorooms.Modules.Modules.Students.Domain;
using Knorooms.Modules.Modules.Subscriptions.Domain;
using Knorooms.Modules.Modules.SupportAccess.Domain;
using Knorooms.Modules.Modules.Tenants.Domain;
using Knorooms.SharedKernel.Domain;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace Knorooms.Modules.Common.Persistence;

/// <summary>
/// DbContext compartido del monolito modular KNOROOMS.
/// Aplica configuraciones modulares (IEntityTypeConfiguration), filtros globales de defensa adicional
/// por TenantId, validación de pertenencia en escrituras y persistencia transaccional del Outbox.
/// </summary>
public sealed partial class ApplicationDbContext(
    DbContextOptions<ApplicationDbContext> options,
    ITenantContextAccessor tenantContextAccessor) : DbContext(options)
{
    public Guid? CurrentTenantId => tenantContextAccessor.Current.TenantId;

    public Guid? CurrentUserId => tenantContextAccessor.Current.UserId;

    public DatabaseExecutionMode CurrentExecutionMode => tenantContextAccessor.Current.ExecutionMode;

    public DbSet<InstitutionModuleSettings> InstitutionModuleSettings => Set<InstitutionModuleSettings>();

    public DbSet<PlanVersion> PlanVersions => Set<PlanVersion>();
    public DbSet<InstitutionSubscription> InstitutionSubscriptions => Set<InstitutionSubscription>();
    public DbSet<SubscriptionModuleOverride> SubscriptionModuleOverrides => Set<SubscriptionModuleOverride>();

    // 1. Tenants
    public DbSet<Institution> Institutions => Set<Institution>();

    // 2. Identity
    public DbSet<AdministratorInvitation> AdministratorInvitations => Set<AdministratorInvitation>();
    public DbSet<UserAccount> Users => Set<UserAccount>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    // 3. Authorization
    public DbSet<PermissionRecord> Permissions => Set<PermissionRecord>();
    public DbSet<InstitutionRole> InstitutionRoles => Set<InstitutionRole>();
    public DbSet<InstitutionRolePermission> InstitutionRolePermissions => Set<InstitutionRolePermission>();
    public DbSet<TenantMembership> TenantMemberships => Set<TenantMembership>();
    public DbSet<TenantMembershipRole> TenantMembershipRoles => Set<TenantMembershipRole>();

    // 4. SupportAccess
    public DbSet<SupportAccessGrant> SupportAccessGrants => Set<SupportAccessGrant>();

    // 5. Audit
    public DbSet<AuditLogEntry> AuditLogs => Set<AuditLogEntry>();

    // 6. Platform (Outbox)
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();

    // 7. Students
    public DbSet<StudentRecord> Students => Set<StudentRecord>();
    public DbSet<Guardian> Guardians => Set<Guardian>();
    public DbSet<StudentGuardianLink> StudentGuardianLinks => Set<StudentGuardianLink>();

    // 8. Academic
    public DbSet<AcademicYear> AcademicYears => Set<AcademicYear>();
    public DbSet<GradeLevel> GradeLevels => Set<GradeLevel>();
    public DbSet<SchoolSection> SchoolSections => Set<SchoolSection>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<TeacherAssignment> TeacherAssignments => Set<TeacherAssignment>();

    // 9. Enrollments
    public DbSet<StudentEnrollment> StudentEnrollments => Set<StudentEnrollment>();

    // 10. Attendance
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();

    // 11. Grading
    public DbSet<EvaluationPolicyVersion> EvaluationPolicyVersions => Set<EvaluationPolicyVersion>();
    public DbSet<GradeEntry> GradeEntries => Set<GradeEntry>();

    // 12. ReportCards
    public DbSet<ReportCardSnapshot> ReportCardSnapshots => Set<ReportCardSnapshot>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        modelBuilder.Entity<InstitutionModuleSettings>().HasOne<Institution>().WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<InstitutionModuleSettings>().HasQueryFilter(e => (CurrentTenantId != null && e.TenantId == CurrentTenantId) || CurrentExecutionMode == DatabaseExecutionMode.PlatformDirectory);
        modelBuilder.Entity<AdministratorInvitation>().HasQueryFilter(e => (CurrentTenantId != null && e.TenantId == CurrentTenantId) || CurrentExecutionMode == DatabaseExecutionMode.PlatformDirectory);

        modelBuilder.Entity<InstitutionSubscription>().HasOne<Institution>().WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<InstitutionSubscription>().HasQueryFilter(e => CurrentTenantId != null && e.TenantId == CurrentTenantId);
        modelBuilder.Entity<SubscriptionModuleOverride>().HasQueryFilter(e => CurrentTenantId != null && e.TenantId == CurrentTenantId);

        // Filtros globales de EF Core como defensa adicional complementaria a PostgreSQL RLS.
        modelBuilder.Entity<InstitutionRole>()
            .HasQueryFilter(e => (CurrentTenantId != null && e.TenantId == CurrentTenantId) || CurrentExecutionMode == DatabaseExecutionMode.PlatformDirectory);

        modelBuilder.Entity<InstitutionRolePermission>()
            .HasQueryFilter(e => CurrentTenantId != null && e.TenantId == CurrentTenantId);

        modelBuilder.Entity<TenantMembership>()
            .HasQueryFilter(e =>
                (CurrentTenantId != null && e.TenantId == CurrentTenantId) ||
                (CurrentUserId != null && e.UserId == CurrentUserId) || CurrentExecutionMode == DatabaseExecutionMode.PlatformDirectory);

        modelBuilder.Entity<TenantMembershipRole>()
            .HasQueryFilter(e => (CurrentTenantId != null && e.TenantId == CurrentTenantId) || CurrentExecutionMode == DatabaseExecutionMode.PlatformDirectory);

        modelBuilder.Entity<SupportAccessGrant>()
            .HasQueryFilter(e =>
                (CurrentTenantId != null && e.TenantId == CurrentTenantId) ||
                CurrentExecutionMode == DatabaseExecutionMode.PlatformSupport);

        modelBuilder.Entity<StudentRecord>()
            .HasQueryFilter(e => CurrentTenantId != null && e.TenantId == CurrentTenantId);

        modelBuilder.Entity<Guardian>()
            .HasQueryFilter(e => CurrentTenantId != null && e.TenantId == CurrentTenantId);

        modelBuilder.Entity<StudentGuardianLink>()
            .HasQueryFilter(e => CurrentTenantId != null && e.TenantId == CurrentTenantId);

        modelBuilder.Entity<AcademicYear>()
            .HasQueryFilter(e => CurrentTenantId != null && e.TenantId == CurrentTenantId);

        modelBuilder.Entity<GradeLevel>()
            .HasQueryFilter(e => CurrentTenantId != null && e.TenantId == CurrentTenantId);

        modelBuilder.Entity<SchoolSection>()
            .HasQueryFilter(e => CurrentTenantId != null && e.TenantId == CurrentTenantId);

        modelBuilder.Entity<Subject>()
            .HasQueryFilter(e => CurrentTenantId != null && e.TenantId == CurrentTenantId);

        modelBuilder.Entity<TeacherAssignment>()
            .HasQueryFilter(e => CurrentTenantId != null && e.TenantId == CurrentTenantId);

        modelBuilder.Entity<StudentEnrollment>()
            .HasQueryFilter(e => CurrentTenantId != null && e.TenantId == CurrentTenantId);

        modelBuilder.Entity<AttendanceRecord>()
            .HasQueryFilter(e => CurrentTenantId != null && e.TenantId == CurrentTenantId);

        modelBuilder.Entity<EvaluationPolicyVersion>()
            .HasQueryFilter(e => CurrentTenantId != null && e.TenantId == CurrentTenantId);

        modelBuilder.Entity<GradeEntry>()
            .HasQueryFilter(e => CurrentTenantId != null && e.TenantId == CurrentTenantId);

        modelBuilder.Entity<ReportCardSnapshot>()
            .HasQueryFilter(e => CurrentTenantId != null && e.TenantId == CurrentTenantId);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => SaveChangesAsync(true, cancellationToken);

    public override async Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        ValidateTenantScopedChanges();
        var modules = ChangedCommercialModules();
        await using var transaction = modules.Length > 0 && Database.CurrentTransaction is null
            ? await Database.BeginTransactionAsync(cancellationToken) : null;
        if (modules.Length > 0) await ValidateCommercialWritesAsync(modules, cancellationToken);
        EnqueueDomainEventsToOutbox();
        var result = await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
        if (transaction is not null) await transaction.CommitAsync(cancellationToken);
        return result;
    }

    public override int SaveChanges() => SaveChanges(true);

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        ValidateTenantScopedChanges();
        if (ChangedCommercialModules().Length > 0)
            throw new InvalidOperationException("Los cambios académicos requieren SaveChangesAsync para validar la contratación.");
        EnqueueDomainEventsToOutbox();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    private void ValidateTenantScopedChanges()
    {
        var scope = tenantContextAccessor.Current;
        foreach (var entry in ChangeTracker.Entries<ITenantScopedEntity>())
        {
            if (entry.State is not (EntityState.Added or EntityState.Modified or EntityState.Deleted))
            {
                continue;
            }

            if (entry.Entity.TenantId == Guid.Empty)
            {
                throw new InvalidOperationException(
                    $"Tenant-scoped entity '{entry.Entity.GetType().Name}' cannot be persisted with an empty TenantId.");
            }

            // En modo PlatformSupport solo se permite crear solicitudes SupportAccessGrant para el tenant objetivo.
            if (scope.ExecutionMode == DatabaseExecutionMode.PlatformSupport && entry.Entity is SupportAccessGrant)
            {
                continue;
            }

            if (!scope.HasResolvedTenant || scope.TenantId != entry.Entity.TenantId)
            {
                throw new InvalidOperationException(
                    $"Cross-tenant write blocked for '{entry.Entity.GetType().Name}': entity TenantId '{entry.Entity.TenantId}' does not match active scope TenantId '{scope.TenantId}'.");
            }
        }
    }

    private void EnqueueDomainEventsToOutbox()
    {
        var entitiesWithEvents = ChangeTracker.Entries<Entity>()
            .Where(e => e.Entity.DomainEvents.Count > 0)
            .Select(e => e.Entity)
            .ToList();

        if (entitiesWithEvents.Count == 0)
        {
            return;
        }

        foreach (var entity in entitiesWithEvents)
        {
            foreach (var domainEvent in entity.DomainEvents)
            {
                OutboxMessages.Add(OutboxMessage.FromDomainEvent(domainEvent));
            }

            entity.ClearDomainEvents();
        }
    }
}
