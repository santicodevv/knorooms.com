using System.Text;
using Knorooms.IntegrationTests.Infrastructure;
using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Authorization.Domain;
using Knorooms.Modules.Modules.Files.Contracts;
using Knorooms.Modules.Modules.Identity.Domain;
using Knorooms.Modules.Modules.Platform.Contracts;
using Knorooms.SharedKernel.Authorization;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Knorooms.IntegrationTests.Files;

[Collection(PostgresDatabaseCollection.Name)]
public sealed class StoredFileIntegrationTests(
    PostgresIntegrationDatabaseFixture fixture)
{
    [Fact]
    public async Task UploadDownloadDelete_EnforcesTenantIsolationAndSafeAudit()
    {
        await using var provider = fixture.CreateAppRoleServiceProvider();

        Guid tenantAId;
        Guid tenantBId;
        Guid userId;

        var suffix = Guid.NewGuid().ToString("N")[..8];

        // 1. Crear usuario y dos colegios.
        await using (var scope = provider.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var accessor = scope.ServiceProvider.GetRequiredService<ITenantContextAccessor>();
            var platformService = scope.ServiceProvider.GetRequiredService<IPlatformInstitutionService>();

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
                    $"files-admin-{suffix}",
                    "https://idp.knorooms.test",
                    $"files-admin-{suffix}@knorooms.test",
                    "Files Integration Admin",
                    isPlatformAdmin: true).Value;

                db.Users.Add(admin);
                await db.SaveChangesAsync();

                userId = admin.Id;

                tenantAId = (await platformService.CreateInstitutionAsync(
                    admin.Id,
                    new CreateInstitutionCommand(
                        $"files-a-{suffix}",
                        "Colegio Archivos A"))).Value.Id;

                tenantBId = (await platformService.CreateInstitutionAsync(
                    admin.Id,
                    new CreateInstitutionCommand(
                        $"files-b-{suffix}",
                        "Colegio Archivos B"))).Value.Id;
            }
        }

        await SubscriptionTestData.EnableAsync(provider, tenantAId);
        await SubscriptionTestData.EnableAsync(provider, tenantBId);

        // 2. Crear una membresía con permisos de archivos en cada colegio.
        var membershipAId = await CreateMembershipAsync(
            provider, tenantAId, userId, "files-a", "Colegio Archivos A");

        var membershipBId = await CreateMembershipAsync(
            provider, tenantBId, userId, "files-b", "Colegio Archivos B");

        var fileName = $"documento-privado-{suffix}.pdf";
        var pdfBytes = Encoding.UTF8.GetBytes(
            "%PDF-1.7\nPRIVATE-PDF-CONTENT\n");

        Guid fileId;

        // 3. Subir archivo al Colegio A.
        await using (var scopeA = provider.CreateAsyncScope())
        {
            var accessor = scopeA.ServiceProvider.GetRequiredService<ITenantContextAccessor>();
            var fileService = scopeA.ServiceProvider.GetRequiredService<IStoredFileService>();

            using (accessor.BeginScope(CreateTenantContext(
                tenantAId, userId, membershipAId, "files-a", "Colegio Archivos A")))
            using (var content = new MemoryStream(pdfBytes))
            {
                var upload = await fileService.UploadAsync(
                    userId,
                    fileName,
                    content);

                Assert.True(upload.IsSuccess);

                fileId = upload.Value.Id;
                Assert.Equal(fileName, upload.Value.OriginalFileName);
                Assert.Equal(pdfBytes.Length, upload.Value.SizeBytes);
                Assert.Equal("application/pdf", upload.Value.ContentType);
            }
        }

        // 4. Colegio B no puede descargar el archivo del Colegio A.
        await using (var scopeB = provider.CreateAsyncScope())
        {
            var accessor = scopeB.ServiceProvider.GetRequiredService<ITenantContextAccessor>();
            var fileService = scopeB.ServiceProvider.GetRequiredService<IStoredFileService>();

            using (accessor.BeginScope(CreateTenantContext(
                tenantBId, userId, membershipBId, "files-b", "Colegio Archivos B")))
            {
                var download = await fileService.DownloadAsync(fileId);

                Assert.True(download.IsFailure);
                Assert.Equal("File.NotFound", download.Error.Code);
            }
        }

        // 5. Colegio A puede descargar su archivo.
        await using (var scopeA = provider.CreateAsyncScope())
        {
            var accessor = scopeA.ServiceProvider.GetRequiredService<ITenantContextAccessor>();
            var fileService = scopeA.ServiceProvider.GetRequiredService<IStoredFileService>();

            using (accessor.BeginScope(CreateTenantContext(
                tenantAId, userId, membershipAId, "files-a", "Colegio Archivos A")))
            {
                var download = await fileService.DownloadAsync(fileId);

                Assert.True(download.IsSuccess);
                Assert.Equal(fileName, download.Value.OriginalFileName);

                await using var downloadedContent = download.Value.Content;
                using var buffer = new MemoryStream();

                await downloadedContent.CopyToAsync(buffer);

                Assert.Equal(pdfBytes, buffer.ToArray());
            }
        }

        // 6. Eliminar archivo y comprobar que ya no se puede descargar.
        await using (var scopeA = provider.CreateAsyncScope())
        {
            var db = scopeA.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var accessor = scopeA.ServiceProvider.GetRequiredService<ITenantContextAccessor>();
            var fileService = scopeA.ServiceProvider.GetRequiredService<IStoredFileService>();

            using (accessor.BeginScope(CreateTenantContext(
                tenantAId, userId, membershipAId, "files-a", "Colegio Archivos A")))
            {
                var delete = await fileService.DeleteAsync(userId, fileId);

                Assert.True(delete.IsSuccess);

                var deletedFile = await db.StoredFiles
                    .AsNoTracking()
                    .SingleAsync(file => file.Id == fileId);

                Assert.True(deletedFile.IsDeleted);
                Assert.NotNull(deletedFile.DeletedAtUtc);

                var downloadAfterDelete = await fileService.DownloadAsync(fileId);

                Assert.True(downloadAfterDelete.IsFailure);
                Assert.Equal("File.NotFound", downloadAfterDelete.Error.Code);

                // 7. Comprobar que la auditoría no guarda el nombre ni el contenido.
                var auditEntries = await db.AuditLogs
                    .AsNoTracking()
                    .Where(log => log.ResourceId == fileId.ToString())
                    .ToListAsync();

                Assert.Contains(auditEntries, log => log.Action == "file.uploaded");
                Assert.Contains(auditEntries, log => log.Action == "file.deleted");

                var auditText = string.Join(
                    " ",
                    auditEntries.Select(log =>
                        $"{log.Summary} {log.MetadataJson}"));

                Assert.DoesNotContain(fileName, auditText);
                Assert.DoesNotContain("PRIVATE-PDF-CONTENT", auditText);
                Assert.DoesNotContain("X-Amz-Signature", auditText);
            }
        }
    }

    private static async Task<Guid> CreateMembershipAsync(
        IServiceProvider provider,
        Guid tenantId,
        Guid userId,
        string slug,
        string name)
    {
        await using var scope = provider.CreateAsyncScope();

        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var accessor = scope.ServiceProvider.GetRequiredService<ITenantContextAccessor>();

        using (accessor.BeginScope(new ExecutionScopeContext(
            TenantHostKind.Institution,
            TenantId: tenantId,
            TenantSlug: slug,
            TenantName: name,
            IsTenantSuspended: false,
            UserId: userId,
            ExecutionMode: DatabaseExecutionMode.Tenant)))
        {
            var role = InstitutionRole.Create(
                tenantId,
                "FILES_TEST",
                "Rol de pruebas de archivos",
                "Permisos para probar archivos privados.",
                isSystemRole: false,
                [
                    PermissionCatalog.InstitutionFilesRead,
                    PermissionCatalog.InstitutionFilesManage
                ]).Value;

            var membership = TenantMembership.Create(
                tenantId,
                userId,
                [role]).Value;

            db.InstitutionRoles.Add(role);
            db.TenantMemberships.Add(membership);

            await db.SaveChangesAsync();

            return membership.Id;
        }
    }

    private static ExecutionScopeContext CreateTenantContext(
        Guid tenantId,
        Guid userId,
        Guid membershipId,
        string slug,
        string name) =>
        new(
            TenantHostKind.Institution,
            TenantId: tenantId,
            TenantSlug: slug,
            TenantName: name,
            IsTenantSuspended: false,
            UserId: userId,
            ExecutionMode: DatabaseExecutionMode.Tenant,
            AccessType: TenantAccessType.Member,
            MembershipId: membershipId);
}
