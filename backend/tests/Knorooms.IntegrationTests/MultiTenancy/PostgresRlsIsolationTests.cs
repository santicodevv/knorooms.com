using Knorooms.IntegrationTests.Infrastructure;
using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Academic.Domain;
using Knorooms.Modules.Modules.Enrollments.Domain;
using Knorooms.Modules.Modules.Identity.Domain;
using Knorooms.Modules.Modules.Platform.Contracts;
using Knorooms.Modules.Modules.Students.Domain;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace Knorooms.IntegrationTests.MultiTenancy;

[Collection(PostgresDatabaseCollection.Name)]
public sealed class PostgresRlsIsolationTests(PostgresIntegrationDatabaseFixture fixture)
{
    [Fact]
    public async Task DatabaseRole_KnoroomsApp_DoesNotBypassRlsAndIsNotSuperuser()
    {
        await using var conn = new NpgsqlConnection(fixture.AppRoleConnectionString);
        await conn.OpenAsync();

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            SELECT current_user, rolsuper, rolbypassrls
            FROM pg_roles
            WHERE rolname = current_user;
            """;

        await using var reader = await cmd.ExecuteReaderAsync();
        Assert.True(await reader.ReadAsync());
        Assert.Equal("knorooms_app", reader.GetString(0));
        Assert.False(reader.GetBoolean(1), "El rol knorooms_app NO debe ser superuser.");
        Assert.False(reader.GetBoolean(2), "El rol knorooms_app NO debe tener BYPASSRLS.");
    }

    [Fact]
    public async Task RlsPolicies_EnforceStrictReadWriteAndForeignKeyIsolationAcrossTenants_EvenWhenEfQueryFiltersAreIgnored()
    {
        await using var provider = fixture.CreateAppRoleServiceProvider();

        Guid tenantAId;
        Guid tenantBId;
        Guid sectionAId;
        Guid sectionBId;
        Guid yearAId;
        Guid yearBId;
        Guid studentAId;
        Guid studentBId;

        // 1. Crear dos colegios independientes desde el servicio de plataforma.
        await using (var setupScope = provider.CreateAsyncScope())
        {
            var db = setupScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var accessor = setupScope.ServiceProvider.GetRequiredService<ITenantContextAccessor>();
            var platformService = setupScope.ServiceProvider.GetRequiredService<IPlatformInstitutionService>();

            using (accessor.BeginScope(new ExecutionScopeContext(
                TenantHostKind.Platform,
                TenantId: null,
                TenantSlug: null,
                TenantName: null,
                IsTenantSuspended: false,
                UserId: null,
                ExecutionMode: DatabaseExecutionMode.Platform)))
            {
                var admin = UserAccount.Create(
                    $"rls-admin-{Guid.NewGuid():N}",
                    "https://idp.knorooms.test",
                    $"rls-admin-{Guid.NewGuid():N}@knorooms.test",
                    "SuperAdmin RLS",
                    isPlatformAdmin: true).Value;

                db.Users.Add(admin);
                await db.SaveChangesAsync();

                var slugA = $"colegio-duarte-{Guid.NewGuid().ToString("N")[..6]}";
                var slugB = $"colegio-mella-{Guid.NewGuid().ToString("N")[..6]}";

                tenantAId = (await platformService.CreateInstitutionAsync(
                    admin.Id,
                    new CreateInstitutionCommand(slugA, "Colegio Juan Pablo Duarte"))).Value.Id;

                tenantBId = (await platformService.CreateInstitutionAsync(
                    admin.Id,
                    new CreateInstitutionCommand(slugB, "Colegio Matías Ramón Mella"))).Value.Id;
            }
        }

        // 2. Poblar datos académicos y un estudiante en Colegio A.
        await SubscriptionTestData.EnableAsync(provider, tenantAId);
        await SubscriptionTestData.EnableAsync(provider, tenantBId);
        await using (var scopeA = provider.CreateAsyncScope())
        {
            var db = scopeA.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var accessor = scopeA.ServiceProvider.GetRequiredService<ITenantContextAccessor>();

            using (accessor.BeginScope(new ExecutionScopeContext(
                TenantHostKind.Institution,
                TenantId: tenantAId,
                TenantSlug: "colegio-duarte",
                TenantName: "Colegio Duarte",
                IsTenantSuspended: false,
                UserId: null,
                ExecutionMode: DatabaseExecutionMode.Tenant)))
            {
                var yearA = AcademicYear.Create(tenantAId, "2026-2027", "Año Escolar 2026-2027", new DateOnly(2026, 8, 15), new DateOnly(2027, 6, 20)).Value;
                var gradeA = GradeLevel.Create(tenantAId, EducationalStage.Secondary, 1, "1-SEC", "1.º de Secundaria").Value;
                var sectionA = SchoolSection.Create(tenantAId, yearA.Id, gradeA.Id, "A", SchoolShift.Morning, 30).Value;
                var studentA = StudentRecord.Create(tenantAId, "EST-A-001", "Juan", "Pérez", new DateOnly(2013, 4, 10)).Value;
                var enrollmentA = StudentEnrollment.Create(tenantAId, studentA.Id, yearA.Id, sectionA.Id).Value;

                db.AcademicYears.Add(yearA);
                db.GradeLevels.Add(gradeA);
                db.SchoolSections.Add(sectionA);
                db.Students.Add(studentA);
                db.StudentEnrollments.Add(enrollmentA);
                await db.SaveChangesAsync();

                yearAId = yearA.Id;
                sectionAId = sectionA.Id;
                studentAId = studentA.Id;
            }
        }

        // 3. Poblar datos académicos y un estudiante en Colegio B.
        await using (var scopeB = provider.CreateAsyncScope())
        {
            var db = scopeB.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var accessor = scopeB.ServiceProvider.GetRequiredService<ITenantContextAccessor>();

            using (accessor.BeginScope(new ExecutionScopeContext(
                TenantHostKind.Institution,
                TenantId: tenantBId,
                TenantSlug: "colegio-mella",
                TenantName: "Colegio Mella",
                IsTenantSuspended: false,
                UserId: null,
                ExecutionMode: DatabaseExecutionMode.Tenant)))
            {
                var yearB = AcademicYear.Create(tenantBId, "2026-2027", "Año Escolar 2026-2027", new DateOnly(2026, 8, 15), new DateOnly(2027, 6, 20)).Value;
                var gradeB = GradeLevel.Create(tenantBId, EducationalStage.Secondary, 1, "1-SEC", "1.º de Secundaria").Value;
                var sectionB = SchoolSection.Create(tenantBId, yearB.Id, gradeB.Id, "A", SchoolShift.Morning, 30).Value;
                var studentB = StudentRecord.Create(tenantBId, "EST-B-001", "María", "Gómez", new DateOnly(2013, 9, 22)).Value;
                var enrollmentB = StudentEnrollment.Create(tenantBId, studentB.Id, yearB.Id, sectionB.Id).Value;

                db.AcademicYears.Add(yearB);
                db.GradeLevels.Add(gradeB);
                db.SchoolSections.Add(sectionB);
                db.Students.Add(studentB);
                db.StudentEnrollments.Add(enrollmentB);
                await db.SaveChangesAsync();

                yearBId = yearB.Id;
                sectionBId = sectionB.Id;
                studentBId = studentB.Id;
            }
        }

        // 4. Verificar aislamiento de lectura con IgnoreQueryFilters() (prueba directa de PostgreSQL RLS).
        await using (var verifyScope = provider.CreateAsyncScope())
        {
            var db = verifyScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var accessor = verifyScope.ServiceProvider.GetRequiredService<ITenantContextAccessor>();

            using (accessor.BeginScope(new ExecutionScopeContext(
                TenantHostKind.Institution,
                TenantId: tenantAId,
                TenantSlug: "colegio-duarte",
                TenantName: "Colegio Duarte",
                IsTenantSuspended: false,
                UserId: null,
                ExecutionMode: DatabaseExecutionMode.Tenant)))
            {
                var studentsInA = await db.Students.IgnoreQueryFilters().AsNoTracking().ToListAsync();
                Assert.Single(studentsInA);
                Assert.Equal(studentAId, studentsInA[0].Id);
                Assert.Equal(tenantAId, studentsInA[0].TenantId);
            }

            // Reutilizando el mismo proveedor/pool, cambiar al contexto del Colegio B.
            using (accessor.BeginScope(new ExecutionScopeContext(
                TenantHostKind.Institution,
                TenantId: tenantBId,
                TenantSlug: "colegio-mella",
                TenantName: "Colegio Mella",
                IsTenantSuspended: false,
                UserId: null,
                ExecutionMode: DatabaseExecutionMode.Tenant)))
            {
                var studentsInB = await db.Students.IgnoreQueryFilters().AsNoTracking().ToListAsync();
                Assert.Single(studentsInB);
                Assert.Equal(studentBId, studentsInB[0].Id);
                Assert.Equal(tenantBId, studentsInB[0].TenantId);
            }

            // En modo Platform (admin global), las tablas académicas NO tienen bypass de RLS: devuelve 0 filas.
            using (accessor.BeginScope(new ExecutionScopeContext(
                TenantHostKind.Platform,
                TenantId: null,
                TenantSlug: null,
                TenantName: null,
                IsTenantSuspended: false,
                UserId: null,
                ExecutionMode: DatabaseExecutionMode.Platform)))
            {
                var studentsAsPlatform = await db.Students.IgnoreQueryFilters().AsNoTracking().ToListAsync();
                Assert.Empty(studentsAsPlatform);
            }
        }

        // 5. Verificar que una escritura cruzada entre tenants es bloqueada por PostgreSQL RLS (WITH CHECK -> SQLSTATE 42501).
        await using (var crossWriteScope = provider.CreateAsyncScope())
        {
            var db = crossWriteScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var accessor = crossWriteScope.ServiceProvider.GetRequiredService<ITenantContextAccessor>();

            using (accessor.BeginScope(new ExecutionScopeContext(
                TenantHostKind.Institution,
                TenantId: tenantAId,
                TenantSlug: "colegio-duarte",
                TenantName: "Colegio Duarte",
                IsTenantSuspended: false,
                UserId: null,
                ExecutionMode: DatabaseExecutionMode.Tenant)))
            {
                // 5a. Bloqueo en SaveChanges de EF Core cuando una entidad lleva el TenantId de otro colegio.
                var forgedStudentForB = StudentRecord.Create(tenantBId, "FORGED-01", "Intruso", "B", new DateOnly(2012, 1, 1)).Value;
                db.Students.Add(forgedStudentForB);
                await Assert.ThrowsAsync<InvalidOperationException>(() => db.SaveChangesAsync());
                db.ChangeTracker.Clear();

                // 5b. Bloqueo directo en motor PostgreSQL mediante SQL crudo intentando insertar en Tenant B desde contexto Tenant A.
                var pgEx = await Assert.ThrowsAsync<PostgresException>(() =>
                    db.Database.ExecuteSqlInterpolatedAsync($"""
                        INSERT INTO public.students (id, tenant_id, student_code, first_name, last_name, birth_date, is_active, created_at_utc)
                        VALUES ({Guid.CreateVersion7()}, {tenantBId}, 'RAW-FORGED', 'Raw', 'Forged', {new DateOnly(2012, 1, 1)}, true, {DateTimeOffset.UtcNow});
                        """));

                Assert.Equal("42501", pgEx.SqlState); // insufficient_privilege / RLS policy violation

                // 5c. Integridad referencial entre colegios: intentar matricular un estudiante de A usando la sección de B falla por FK compuesta.
                var invalidCrossEnrollment = StudentEnrollment.Create(tenantAId, studentAId, yearBId, sectionBId).Value;
                db.StudentEnrollments.Add(invalidCrossEnrollment);
                await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
            }
        }
    }
}
