using System.Data;
using System.Data.Common;
using System.Runtime.CompilerServices;
using Knorooms.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Npgsql;

namespace Knorooms.Modules.Common.Persistence;

/// <summary>
/// Interceptor de conexiones y comandos de EF Core que sincroniza de forma segura el contexto de tenant
/// y modo de ejecución en PostgreSQL mediante <c>set_config(..., is_local)</c>.
///
/// Diseño ante connection pooling, consultas de lectura y transacciones:
/// 1. En comandos dentro de una transacción explícita (incluyendo todo <c>SaveChangesAsync</c>),
///    establece las variables con <c>is_local = true</c> (ámbito estrictamente local a la transacción).
/// 2. En consultas de lectura sin transacción explícita, establece las variables antes del comando
///    y las limpia al cerrar/devolver la conexión al pool (<c>ConnectionClosing</c>).
/// 3. Si el <see cref="ExecutionScopeContext"/> cambia dentro de la misma conexión (p. ej. cambio de scope
///    con <c>BeginScope</c>), vuelve a sincronizar inmediatamente antes de ejecutar el siguiente comando.
/// </summary>
public sealed class PostgresRlsInterceptor(ITenantContextAccessor tenantContextAccessor)
    : DbCommandInterceptor, IDbConnectionInterceptor
{
    private static readonly AsyncLocal<bool> IsApplyingRlsConfig = new();

    private readonly ConditionalWeakTable<DbConnection, AppliedRlsState> _connectionStates = new();

    private sealed class AppliedRlsState
    {
        public string TenantId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string ExecutionMode { get; set; } = "none";
        public DbTransaction? Transaction { get; set; }
        public bool Initialized { get; set; }
    }

    public override InterceptionResult<DbDataReader> ReaderExecuting(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<DbDataReader> result)
    {
        EnsureRlsContextSynchronized(command);
        return base.ReaderExecuting(command, eventData, result);
    }

    public override async ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<DbDataReader> result,
        CancellationToken cancellationToken = default)
    {
        await EnsureRlsContextSynchronizedAsync(command, cancellationToken);
        return await base.ReaderExecutingAsync(command, eventData, result, cancellationToken);
    }

    public override InterceptionResult<int> NonQueryExecuting(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<int> result)
    {
        EnsureRlsContextSynchronized(command);
        return base.NonQueryExecuting(command, eventData, result);
    }

    public override async ValueTask<InterceptionResult<int>> NonQueryExecutingAsync(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        await EnsureRlsContextSynchronizedAsync(command, cancellationToken);
        return await base.NonQueryExecutingAsync(command, eventData, result, cancellationToken);
    }

    public override InterceptionResult<object> ScalarExecuting(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<object> result)
    {
        EnsureRlsContextSynchronized(command);
        return base.ScalarExecuting(command, eventData, result);
    }

    public override async ValueTask<InterceptionResult<object>> ScalarExecutingAsync(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<object> result,
        CancellationToken cancellationToken = default)
    {
        await EnsureRlsContextSynchronizedAsync(command, cancellationToken);
        return await base.ScalarExecutingAsync(command, eventData, result, cancellationToken);
    }

    public InterceptionResult ConnectionClosing(DbConnection connection, ConnectionEventData eventData, InterceptionResult result)
    {
        ResetConnectionSessionState(connection);
        return result;
    }

    public async ValueTask<InterceptionResult> ConnectionClosingAsync(
        DbConnection connection,
        ConnectionEventData eventData,
        InterceptionResult result)
    {
        await ResetConnectionSessionStateAsync(connection);
        return result;
    }

    private void EnsureRlsContextSynchronized(DbCommand targetCommand)
    {
        if (IsApplyingRlsConfig.Value || targetCommand.Connection is not NpgsqlConnection connection ||
            connection.State != ConnectionState.Open)
        {
            return;
        }

        var scope = tenantContextAccessor.Current;
        var tenantId = scope.TenantId?.ToString() ?? string.Empty;
        var userId = scope.UserId?.ToString() ?? string.Empty;
        var mode = scope.GetPostgresExecutionModeValue();
        var state = _connectionStates.GetOrCreateValue(connection);

        if (state.Initialized &&
            state.TenantId == tenantId &&
            state.UserId == userId &&
            state.ExecutionMode == mode &&
            ReferenceEquals(state.Transaction, targetCommand.Transaction))
        {
            return;
        }

        IsApplyingRlsConfig.Value = true;
        try
        {
            using var configCmd = CreateSetConfigCommand(connection, targetCommand.Transaction, tenantId, userId, mode);
            configCmd.ExecuteNonQuery();

            state.TenantId = tenantId;
            state.UserId = userId;
            state.ExecutionMode = mode;
            state.Transaction = targetCommand.Transaction;
            state.Initialized = true;
        }
        finally
        {
            IsApplyingRlsConfig.Value = false;
        }
    }

    private async ValueTask EnsureRlsContextSynchronizedAsync(DbCommand targetCommand, CancellationToken cancellationToken)
    {
        if (IsApplyingRlsConfig.Value || targetCommand.Connection is not NpgsqlConnection connection ||
            connection.State != ConnectionState.Open)
        {
            return;
        }

        var scope = tenantContextAccessor.Current;
        var tenantId = scope.TenantId?.ToString() ?? string.Empty;
        var userId = scope.UserId?.ToString() ?? string.Empty;
        var mode = scope.GetPostgresExecutionModeValue();
        var state = _connectionStates.GetOrCreateValue(connection);

        if (state.Initialized &&
            state.TenantId == tenantId &&
            state.UserId == userId &&
            state.ExecutionMode == mode &&
            ReferenceEquals(state.Transaction, targetCommand.Transaction))
        {
            return;
        }

        IsApplyingRlsConfig.Value = true;
        try
        {
            await using var configCmd = CreateSetConfigCommand(connection, targetCommand.Transaction, tenantId, userId, mode);
            await configCmd.ExecuteNonQueryAsync(cancellationToken);

            state.TenantId = tenantId;
            state.UserId = userId;
            state.ExecutionMode = mode;
            state.Transaction = targetCommand.Transaction;
            state.Initialized = true;
        }
        finally
        {
            IsApplyingRlsConfig.Value = false;
        }
    }

    private void ResetConnectionSessionState(DbConnection connection)
    {
        _connectionStates.Remove(connection);
        if (IsApplyingRlsConfig.Value || connection is not NpgsqlConnection npgsqlConnection ||
            npgsqlConnection.State != ConnectionState.Open)
        {
            return;
        }

        IsApplyingRlsConfig.Value = true;
        try
        {
            using var resetCmd = CreateResetCommand(npgsqlConnection);
            resetCmd.ExecuteNonQuery();
        }
        catch
        {
            // Si la conexión está abortada o en transacción fallida, Npgsql hará DISCARD ALL al devolverla al pool.
        }
        finally
        {
            IsApplyingRlsConfig.Value = false;
        }
    }

    private async ValueTask ResetConnectionSessionStateAsync(DbConnection connection)
    {
        _connectionStates.Remove(connection);
        if (IsApplyingRlsConfig.Value || connection is not NpgsqlConnection npgsqlConnection ||
            npgsqlConnection.State != ConnectionState.Open)
        {
            return;
        }

        IsApplyingRlsConfig.Value = true;
        try
        {
            await using var resetCmd = CreateResetCommand(npgsqlConnection);
            await resetCmd.ExecuteNonQueryAsync();
        }
        catch
        {
            // Npgsql ejecuta igualmente su protocolo de limpieza de pool.
        }
        finally
        {
            IsApplyingRlsConfig.Value = false;
        }
    }

    private static NpgsqlCommand CreateSetConfigCommand(
        NpgsqlConnection connection,
        DbTransaction? transaction,
        string tenantId,
        string userId,
        string mode)
    {
        // Si hay transacción activa, is_local = true fija las variables estrictamente al ámbito de la transacción actual.
        // Además se fija a nivel de sesión (y se limpia al cerrar la conexión) para cubrir lecturas sin transacción explícita.
        var isLocal = transaction is not null;
        var cmd = connection.CreateCommand();
        cmd.Transaction = transaction as NpgsqlTransaction;
        cmd.CommandText = """
            SELECT
                set_config('app.current_tenant_id', @tenant_id, @is_local),
                set_config('app.current_user_id', @user_id, @is_local),
                set_config('app.execution_mode', @mode, @is_local);
            """;
        cmd.Parameters.AddWithValue("tenant_id", tenantId);
        cmd.Parameters.AddWithValue("user_id", userId);
        cmd.Parameters.AddWithValue("mode", mode);
        cmd.Parameters.AddWithValue("is_local", isLocal);
        return cmd;
    }

    private static NpgsqlCommand CreateResetCommand(NpgsqlConnection connection)
    {
        var cmd = connection.CreateCommand();
        cmd.CommandText = """
            SELECT
                set_config('app.current_tenant_id', '', false),
                set_config('app.current_user_id', '', false),
                set_config('app.execution_mode', 'none', false);
            """;
        return cmd;
    }
}
