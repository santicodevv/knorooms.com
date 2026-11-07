using Amazon.S3;
using Amazon.S3.Model;
using Knorooms.Modules.Modules.Files.Contracts;
using Microsoft.Extensions.Options;

namespace Knorooms.Modules.Modules.Files.Infrastructure;

public sealed class S3FileStorage(
    IAmazonS3 s3Client,
    IOptions<FileStorageOptions> options) : IFileStorage
{
    private readonly FileStorageOptions _options = options.Value;

    public async Task UploadAsync(
        string storageKey,
        Stream content,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        var request = new PutObjectRequest
        {
            BucketName = _options.BucketName,
            Key = storageKey,
            InputStream = content,
            ContentType = contentType
        };

        await s3Client.PutObjectAsync(request, cancellationToken);
    }

    public async Task<Stream> DownloadAsync(
        string storageKey,
        CancellationToken cancellationToken = default)
    {
        var response = await s3Client.GetObjectAsync(
            _options.BucketName,
            storageKey,
            cancellationToken);

        return response.ResponseStream;
    }

    public async Task DeleteAsync(
        string storageKey,
        CancellationToken cancellationToken = default)
    {
        var request = new DeleteObjectRequest
        {
            BucketName = _options.BucketName,
            Key = storageKey
        };

        await s3Client.DeleteObjectAsync(request, cancellationToken);
    }
}