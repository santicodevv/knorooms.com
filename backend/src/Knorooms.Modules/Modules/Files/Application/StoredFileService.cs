using System.Globalization;
using System.Security.Cryptography;
using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Audit.Domain;
using Knorooms.Modules.Modules.Files.Contracts;
using Knorooms.Modules.Modules.Files.Domain;
using Knorooms.SharedKernel.Results;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Knorooms.Modules.Modules.Files.Application;

internal sealed class StoredFileService(
    ApplicationDbContext dbContext,
    IFileStorage fileStorage,
    ITenantContextAccessor tenantContextAccessor,
    IOptions<FileStorageOptions> options) : IStoredFileService
{
    private readonly FileStorageOptions _options = options.Value;

    public async Task<Result<StoredFileDto>> UploadAsync(
        Guid actorUserId,
        string originalFileName,
        Stream content,
        CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;

        if (scope.TenantId is null || scope.TenantId == Guid.Empty ||
            scope.UserId != actorUserId || actorUserId == Guid.Empty)
        {
            return Result.Failure<StoredFileDto>(
                Error.Forbidden(
                    "File.TenantContextRequired",
                    "Se requiere un usuario autenticado y un colegio activo."));
        }

        if (content is null || !content.CanRead)
        {
            return Result.Failure<StoredFileDto>(
                Error.Validation("File.InvalidContent", "El contenido del archivo no es válido."));
        }

        if (_options.MaxFileSizeBytes <= 0 ||
            _options.MaxFileSizeBytes > int.MaxValue)
        {
            return Result.Failure<StoredFileDto>(
                Error.Validation("File.InvalidConfiguration", "El límite de tamaño configurado no es válido."));
        }

        var fileName = Path.GetFileName(
            (originalFileName ?? string.Empty).Replace('\\', '/')).Trim();

        if (string.IsNullOrWhiteSpace(fileName) || fileName.Length > 255)
        {
            return Result.Failure<StoredFileDto>(
                Error.Validation("File.InvalidName", "El nombre del archivo no es válido."));
        }

        var extension = Path.GetExtension(fileName).ToLowerInvariant();

        if (!_options.AllowedExtensions.Contains(
                extension,
                StringComparer.OrdinalIgnoreCase))
        {
            return Result.Failure<StoredFileDto>(
                Error.Validation("File.ExtensionNotAllowed", "La extensión del archivo no está permitida."));
        }

        await using var buffer = new MemoryStream();

        var chunk = new byte[81920];
        long totalBytes = 0;

        while (true)
        {
            var bytesRead = await content.ReadAsync(
                chunk.AsMemory(0, chunk.Length),
                cancellationToken);

            if (bytesRead == 0)
            {
                break;
            }

            totalBytes += bytesRead;

            if (totalBytes > _options.MaxFileSizeBytes)
            {
                return Result.Failure<StoredFileDto>(
                    Error.Validation("File.TooLarge", "El archivo supera el tamaño máximo permitido."));
            }

            await buffer.WriteAsync(
                chunk.AsMemory(0, bytesRead),
                cancellationToken);
        }

        var bytes = buffer.ToArray();

        var detectedContentType = DetectContentType(bytes);

        if (detectedContentType is null ||
            !ExtensionMatchesContentType(extension, detectedContentType))
        {
            return Result.Failure<StoredFileDto>(
                Error.Validation("File.InvalidContent", "El contenido real del archivo no coincide con su extensión."));
        }

        var sha256 = Convert.ToHexString(SHA256.HashData(bytes));

        var fileResult = StoredFile.Create(
            scope.TenantId.Value,
            fileName,
            detectedContentType,
            totalBytes,
            sha256,
            actorUserId);

        if (fileResult.IsFailure)
        {
            return Result.Failure<StoredFileDto>(fileResult.Error);
        }

        var storedFile = fileResult.Value;

        await using var uploadStream = new MemoryStream(bytes);

        await fileStorage.UploadAsync(
            storedFile.StorageKey,
            uploadStream,
            storedFile.ContentType,
            cancellationToken);

        dbContext.StoredFiles.Add(storedFile);

        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: storedFile.TenantId,
            actorUserId: actorUserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: scope.SupportAccessGrantId,
            action: "file.uploaded",
            resourceType: nameof(StoredFile),
            resourceId: storedFile.Id.ToString(),
            summary: "Archivo privado cargado.",
            metadata: new Dictionary<string, string?>
            {
                ["sizeBytes"] = storedFile.SizeBytes.ToString(CultureInfo.InvariantCulture),
                ["contentType"] = storedFile.ContentType
            }));

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            await fileStorage.DeleteAsync(
                storedFile.StorageKey,
                CancellationToken.None);

            throw;
        }

        return Result.Success(ToDto(storedFile));
    }

    public async Task<Result<StoredFileDownload>> DownloadAsync(
        Guid fileId,
        CancellationToken cancellationToken = default)
    {
        var tenantId = tenantContextAccessor.Current.TenantId;

        if (tenantId is null || tenantId == Guid.Empty)
        {
            return Result.Failure<StoredFileDownload>(
                Error.Forbidden(
                    "File.TenantContextRequired",
                    "Se requiere un colegio activo."));
        }

        var storedFile = await dbContext.StoredFiles
            .AsNoTracking()
            .SingleOrDefaultAsync(
                file => file.Id == fileId &&
                        file.TenantId == tenantId.Value &&
                        file.DeletedAtUtc == null,
                cancellationToken);

        if (storedFile is null)
        {
            return Result.Failure<StoredFileDownload>(
                Error.NotFound(
                    "File.NotFound",
                    "El archivo solicitado no existe."));
        }

        var stream = await fileStorage.DownloadAsync(
            storedFile.StorageKey,
            cancellationToken);

        return Result.Success(new StoredFileDownload(
            stream,
            storedFile.OriginalFileName,
            storedFile.ContentType));
    }

    public async Task<Result> DeleteAsync(
        Guid actorUserId,
        Guid fileId,
        CancellationToken cancellationToken = default)
    {
        var scope = tenantContextAccessor.Current;

        if (scope.TenantId is null || scope.TenantId == Guid.Empty ||
            scope.UserId != actorUserId || actorUserId == Guid.Empty)
        {
            return Result.Failure(
                Error.Forbidden(
                    "File.TenantContextRequired",
                    "Se requiere un usuario autenticado y un colegio activo."));
        }

        var tenantId = scope.TenantId.Value;

        var storedFile = await dbContext.StoredFiles
            .SingleOrDefaultAsync(
                file => file.Id == fileId &&
                        file.TenantId == tenantId &&
                        file.DeletedAtUtc == null,
                cancellationToken);

        if (storedFile is null)
        {
            return Result.Failure(
                Error.NotFound(
                    "File.NotFound",
                    "El archivo solicitado no existe."));
        }

        var deleteResult = storedFile.Delete();

        if (deleteResult.IsFailure)
        {
            return deleteResult;
        }

        dbContext.AuditLogs.Add(AuditLogEntry.Create(
            tenantId: tenantId,
            actorUserId: actorUserId,
            actorAccessType: scope.AccessType.ToString(),
            supportAccessGrantId: scope.SupportAccessGrantId,
            action: "file.deleted",
            resourceType: nameof(StoredFile),
            resourceId: storedFile.Id.ToString(),
            summary: "Archivo privado eliminado."));

        await dbContext.SaveChangesAsync(cancellationToken);

        await fileStorage.DeleteAsync(
            storedFile.StorageKey,
            cancellationToken);

        return Result.Success();
    }

    private static StoredFileDto ToDto(StoredFile file) =>
        new(
            file.Id,
            file.OriginalFileName,
            file.ContentType,
            file.SizeBytes,
            file.Sha256,
            file.UploadedByUserId,
            file.CreatedAtUtc);

    private static string? DetectContentType(byte[] bytes)
    {
        if (bytes.Length >= 5 &&
            bytes[0] == 0x25 &&
            bytes[1] == 0x50 &&
            bytes[2] == 0x44 &&
            bytes[3] == 0x46 &&
            bytes[4] == 0x2D)
        {
            return "application/pdf";
        }

        if (bytes.Length >= 8 &&
            bytes[0] == 0x89 &&
            bytes[1] == 0x50 &&
            bytes[2] == 0x4E &&
            bytes[3] == 0x47 &&
            bytes[4] == 0x0D &&
            bytes[5] == 0x0A &&
            bytes[6] == 0x1A &&
            bytes[7] == 0x0A)
        {
            return "image/png";
        }

        if (bytes.Length >= 3 &&
            bytes[0] == 0xFF &&
            bytes[1] == 0xD8 &&
            bytes[2] == 0xFF)
        {
            return "image/jpeg";
        }

        return null;
    }

    private static bool ExtensionMatchesContentType(
        string extension,
        string contentType) =>
        (extension == ".pdf" && contentType == "application/pdf") ||
        (extension == ".png" && contentType == "image/png") ||
        ((extension == ".jpg" || extension == ".jpeg") &&
         contentType == "image/jpeg");
}
