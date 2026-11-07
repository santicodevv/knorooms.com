using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.Files.Contracts;

public sealed record StoredFileDto(
    Guid Id,
    string OriginalFileName,
    string ContentType,
    long SizeBytes,
    string Sha256,
    Guid UploadedByUserId,
    DateTimeOffset CreatedAtUtc);

public sealed record StoredFileDownload(
    Stream Content,
    string OriginalFileName,
    string ContentType);

public interface IStoredFileService
{
    Task<Result<StoredFileDto>> UploadAsync(
        Guid actorUserId,
        string originalFileName,
        Stream content,
        CancellationToken cancellationToken = default);

    Task<Result<StoredFileDownload>> DownloadAsync(
        Guid fileId,
        CancellationToken cancellationToken = default);

    Task<Result> DeleteAsync(
        Guid actorUserId,
        Guid fileId,
        CancellationToken cancellationToken = default);
}
