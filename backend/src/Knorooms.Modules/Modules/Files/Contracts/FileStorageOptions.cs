namespace Knorooms.Modules.Modules.Files.Contracts;

public sealed class FileStorageOptions
{
    public const string SectionName = "FileStorage";

    public string ServiceUrl { get; set; } = "http://localhost:9000";

    public string AccessKey { get; set; } = string.Empty;

    public string SecretKey { get; set; } = string.Empty;

    public string BucketName { get; set; } = "knorooms-private-files";

    public string Region { get; set; } = "us-east-1";

    public bool ForcePathStyle { get; set; } = true;

    public long MaxFileSizeBytes { get; set; } = 10 * 1024 * 1024;

    public string[] AllowedExtensions { get; set; } =
    [
        ".pdf",
        ".png",
        ".jpg",
        ".jpeg"
    ];
}
