using Amazon.Runtime;
using Amazon.S3;
using DotNet.Testcontainers.Builders;
using DotNet.Testcontainers.Containers;
using Knorooms.Modules;
using Knorooms.Modules.Common.Persistence;
using Knorooms.Modules.Modules.Files.Contracts;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Npgsql;
using Testcontainers.PostgreSql;

namespace Knorooms.IntegrationTests.Infrastructure;

/// <summary>
/// Fixture compartido que levanta PostgreSQL 17 y almacenamiento S3 compatible
/// mediante Testcontainers, ejecuta las migraciones y configura el rol
/// de aplicación knorooms_app con NOBYPASSRLS y NOSUPERUSER.
/// </summary>
public sealed class PostgresIntegrationDatabaseFixture : IAsyncLifetime
{
    private PostgreSqlContainer? _container;
    private IContainer? _storageContainer;

    public string MigratorConnectionString { get; private set; } = string.Empty;

    public string AppRoleConnectionString { get; private set; } = string.Empty;

    public string StorageServiceUrl { get; private set; } = string.Empty;

    public string StorageAccessKey { get; } = "knorooms_test";

    public string StorageSecretKey { get; } = "knorooms_test_password";

    public string StorageBucketName { get; } = "knorooms-private-files-test";

    public async Task InitializeAsync()
    {
        // 1. Levantar PostgreSQL.
        _container = new PostgreSqlBuilder("postgres:17-alpine")
            .WithDatabase("knorooms_test")
            .WithUsername("knorooms_migrator")
            .WithPassword("knorooms_migrator_pwd")
            .Build();

        await _container.StartAsync();

        MigratorConnectionString = _container.GetConnectionString();

        // 2. Ejecutar migraciones y poblar el catálogo.
        var services = new ServiceCollection();

        var configuration = new ConfigurationBuilder()
            .Build();

        services.AddSingleton<IConfiguration>(configuration);
        services.AddLogging();

        services.AddKnoroomsModules(
            MigratorConnectionString,
            enableOutboxBackgroundWorker: false);

        await using (var provider = services.BuildServiceProvider())
        await using (var scope = provider.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var accessor = scope.ServiceProvider.GetRequiredService<ITenantContextAccessor>();

            await DatabaseSeedAndInitializer.MigrateAndSeedCatalogAsync(
                db,
                accessor,
                NullLogger.Instance);
        }

        // 3. Crear el rol de aplicación sin BYPASSRLS.
        await using (var conn = new NpgsqlConnection(MigratorConnectionString))
        {
            await conn.OpenAsync();

            await using var cmd = conn.CreateCommand();

            cmd.CommandText = """
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'knorooms_app') THEN
                        CREATE ROLE knorooms_app
                            LOGIN
                            PASSWORD 'knorooms_app_test_pwd'
                            NOSUPERUSER
                            NOCREATEDB
                            NOCREATEROLE
                            NOBYPASSRLS;
                    END IF;
                END
                $$;

                GRANT CONNECT ON DATABASE knorooms_test TO knorooms_app;
                GRANT USAGE ON SCHEMA public TO knorooms_app;
                GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO knorooms_app;
                GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO knorooms_app;
                """;

            await cmd.ExecuteNonQueryAsync();
        }

        var builder = new NpgsqlConnectionStringBuilder(MigratorConnectionString)
        {
            Username = "knorooms_app",
            Password = "knorooms_app_test_pwd",
            Pooling = true
        };

        AppRoleConnectionString = builder.ConnectionString;

        // 4. Levantar almacenamiento S3 compatible.
        _storageContainer = new ContainerBuilder(
                "docker.io/pgsty/silo:RELEASE.2026-10-26T00-00-00Z")
            .WithPortBinding(9000, true)
            .WithEnvironment("MINIO_ROOT_USER", StorageAccessKey)
            .WithEnvironment("MINIO_ROOT_PASSWORD", StorageSecretKey)
            .WithCommand("server", "/data", "--console-address", ":9001")
            .WithWaitStrategy(
                Wait.ForUnixContainer()
                    .UntilInternalTcpPortIsAvailable(9000))
            .Build();

        await _storageContainer.StartAsync();

        StorageServiceUrl =
            $"http://localhost:{_storageContainer.GetMappedPublicPort(9000)}";

        // 5. Crear el bucket privado para las pruebas.
        var s3Config = new AmazonS3Config
        {
            ServiceURL = StorageServiceUrl,
            ForcePathStyle = true,
            AuthenticationRegion = "us-east-1"
        };

        using var s3Client = new AmazonS3Client(
            new BasicAWSCredentials(StorageAccessKey, StorageSecretKey),
            s3Config);

        await s3Client.PutBucketAsync(StorageBucketName);
    }

    public ServiceProvider CreateAppRoleServiceProvider()
    {
        var services = new ServiceCollection();

        var configuration = new ConfigurationBuilder()
            .Build();

        services.AddSingleton<IConfiguration>(configuration);
        services.AddLogging();

        services.AddKnoroomsModules(
            AppRoleConnectionString,
            enableOutboxBackgroundWorker: false);

        // Configuración S3 para utilizar el contenedor de pruebas.
        services.Configure<FileStorageOptions>(options =>
        {
            options.ServiceUrl = StorageServiceUrl;
            options.AccessKey = StorageAccessKey;
            options.SecretKey = StorageSecretKey;
            options.BucketName = StorageBucketName;
            options.Region = "us-east-1";
            options.ForcePathStyle = true;
        });

        return services.BuildServiceProvider();
    }

    public async Task DisposeAsync()
    {
        if (_storageContainer is not null)
        {
            await _storageContainer.DisposeAsync();
        }

        if (_container is not null)
        {
            await _container.DisposeAsync();
        }
    }
}

[CollectionDefinition(Name)]
public sealed class PostgresDatabaseCollection
    : ICollectionFixture<PostgresIntegrationDatabaseFixture>
{
    public const string Name = "PostgresDatabaseCollection";
}
