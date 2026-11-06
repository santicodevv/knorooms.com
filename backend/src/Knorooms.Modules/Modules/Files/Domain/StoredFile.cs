using Knorooms.SharedKernel.Domain;
using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.Files.Domain;

/// <summary>
/// Archivo privado almacenado para una institución educativa.
/// </summary>
public sealed class StoredFile : TenantScopedEntity
{
    public string OriginalFileName { get; private set; } = string.Empty;

    public string ContentType { get; private set; } = string.Empty;

    public long SizeBytes { get; private set; }

    public string Sha256 { get; private set; } = string.Empty;

    public Guid UploadedByUserId { get; private set; }

    public string StorageKey { get; private set; } = string.Empty;

    public DateTimeOffset? DeletedAtUtc { get; private set; }

    public bool IsDeleted => DeletedAtUtc.HasValue;

    private StoredFile()
    {
    }

    public static Result<StoredFile> Create(
        Guid tenantId,
        string originalFileName,
        string contentType,
        long sizeBytes,
        string sha256,
        Guid uploadedByUserId)
    {
        if (tenantId == Guid.Empty || uploadedByUserId == Guid.Empty)
        {
            return Result.Failure<StoredFile>(
                Error.Validation("File.InvalidOwner", "El colegio y el usuario son obligatorios."));
        }

        if (string.IsNullOrWhiteSpace(originalFileName) ||
            originalFileName.Trim().Length > 255)
        {
            return Result.Failure<StoredFile>(
                Error.Validation("File.InvalidName", "El nombre del archivo no es válido."));
        }

        if (string.IsNullOrWhiteSpace(contentType) ||
            contentType.Trim().Length > 150)
        {
            return Result.Failure<StoredFile>(
                Error.Validation("File.InvalidContentType", "El tipo de archivo no es válido."));
        }

        if (sizeBytes <= 0)
        {
            return Result.Failure<StoredFile>(
                Error.Validation("File.InvalidSize", "El tamaño del archivo debe ser mayor que cero."));
        }

        if (sha256.Length != 64 ||
            !sha256.All(Uri.IsHexDigit))
        {
            return Result.Failure<StoredFile>(
                Error.Validation("File.InvalidHash", "El hash SHA-256 no es válido."));
        }

        var id = Guid.CreateVersion7();

        return Result.Success(new StoredFile
        {
            Id = id,
            TenantId = tenantId,
            OriginalFileName = originalFileName.Trim(),
            ContentType = contentType.Trim(),
            SizeBytes = sizeBytes,
            Sha256 = sha256.ToLowerInvariant(),
            UploadedByUserId = uploadedByUserId,
            StorageKey = $"tenants/{tenantId:N}/{id:N}"
        });
    }

    public Result Delete()
    {
        if (IsDeleted)
        {
            return Result.Failure(
                Error.Conflict("File.AlreadyDeleted", "El archivo ya está eliminado."));
        }

        DeletedAtUtc = DateTimeOffset.UtcNow;
        MarkUpdated();

        return Result.Success();
    }
}