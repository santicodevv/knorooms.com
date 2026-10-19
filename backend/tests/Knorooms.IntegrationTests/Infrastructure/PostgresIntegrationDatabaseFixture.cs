using Knorooms.Modules;
using Knorooms.Modules.Common.Persistence;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Npgsql;
using Testcontainers.PostgreSql;

namespace Knorooms.IntegrationTests.Infrastructure;

/// <summary>
/// Fixture compartido que levanta una instancia real de PostgreSQL 17 mediante Testcontainers,
/// ejecuta la migración inicial de EF Core (incluyendo las políticas RLS) y configura el rol
/// de aplicación <c>knorooms_app</c> con <c>NOBYPASSRLS</c> y <c>NOSUPERUSER</c>.
/// </summary>
public sealed class PostgresIntegrationDatabaseFixture : IAsyncLifetime
{
    private PostgreSqlContainer? _container;

    public string MigratorConnectionString { get; private set; } = string.Empty;

    public string AppRoleConnectionString { get; private set; } = string.Empty;

    public async Task InitializeAsync()
    {
        _container = new PostgreSqlBuilder("postgres:17-alpine")
            .WithDatabase("knorooms_test")
            .WithUsername("knorooms_migrator")
            .WithPassword("knorooms_migrator_pwd")
            .Build();

        await _container.StartAsync();

        MigratorConnectionString = _container.GetConnectionString();

        // 1. Ejecutar migraciones EF Core y poblar catálogo de permisos como migrador.
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddKnoroomsModules(MigratorConnectionString, enableOutboxBackgroundWorker: false);
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

        // 2. Crear rol knorooms_app sin superusuario y sin BYPASSRLS, y otorgar privilegios DML en public.
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
    }

    public ServiceProvider CreateAppRoleServiceProvider()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddKnoroomsModules(AppRoleConnectionString, enableOutboxBackgroundWorker: false);
        return services.BuildServiceProvider();
    }

    public async Task DisposeAsync()
    {
        if (_container is not null)
        {
            await _container.DisposeAsync();
        }
    }
}

[CollectionDefinition(Name)]
public sealed class PostgresDatabaseCollection : ICollectionFixture<PostgresIntegrationDatabaseFixture>
{
    public const string Name = "PostgresDatabaseCollection";
}
