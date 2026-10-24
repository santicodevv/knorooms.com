namespace Knorooms.SharedKernel.Tenancy;

/// <summary>
/// Clasificación del host de entrada resuelto en la petición actual.
/// </summary>
public enum TenantHostKind
{
    /// <summary>Sitio público raíz (p. ej. knorooms.com).</summary>
    Public = 0,

    /// <summary>Consola de administración global (p. ej. admin.knorooms.com).</summary>
    Platform = 1,

    /// <summary>Portal institucional de un colegio (p. ej. colegio-a.knorooms.com).</summary>
    Institution = 2
}

/// <summary>
/// Modo de ejecución enviado al contexto de sesión/transacción de PostgreSQL para políticas RLS.
/// </summary>
public enum DatabaseExecutionMode
{
    /// <summary>Sin contexto privilegio; RLS deniega acceso a tablas institucionales sin tenant.</summary>
    None = 0,

    /// <summary>Operación dentro de un colegio específico (requiere TenantId).</summary>
    Tenant = 1,

    /// <summary>Operación de consola global sobre tablas de plataforma (NO habilita acceso a datos académicos).</summary>
    Platform = 2,

    /// <summary>Operación acotada de aprovisionamiento inicial de administrador institucional o semilla.</summary>
    PlatformOnboarding = 3,

    /// <summary>Operación acotada de gestión de solicitudes de soporte temporal.</summary>
    PlatformSupport = 4,

    /// <summary>Administración comercial acotada a un colegio; sin acceso académico.</summary>
    PlatformCommercial = 5,

    /// <summary>Lectura acotada de metadatos para el listado global; no habilita datos académicos.</summary>
    PlatformDirectory = 6
}

/// <summary>
/// Tipo de acceso con el que el usuario autenticado opera dentro de una institución.
/// </summary>
public enum TenantAccessType
{
    None = 0,
    Member = 1,
    Support = 2
}

/// <summary>
/// Estado inmutable del contexto de tenant y usuario para la operación en curso.
/// </summary>
public sealed record ExecutionScopeContext(
    TenantHostKind HostKind,
    Guid? TenantId,
    string? TenantSlug,
    string? TenantName,
    bool IsTenantSuspended,
    Guid? UserId,
    DatabaseExecutionMode ExecutionMode,
    TenantAccessType AccessType = TenantAccessType.None,
    Guid? MembershipId = null,
    Guid? SupportAccessGrantId = null,
    DateTimeOffset? SupportAccessExpiresAtUtc = null)
{
    public static readonly ExecutionScopeContext Anonymous = new(
        TenantHostKind.Public,
        TenantId: null,
        TenantSlug: null,
        TenantName: null,
        IsTenantSuspended: false,
        UserId: null,
        ExecutionMode: DatabaseExecutionMode.None);

    public bool HasResolvedTenant => TenantId.HasValue && TenantId.Value != Guid.Empty;

    public string GetPostgresExecutionModeValue() => ExecutionMode switch
    {
        DatabaseExecutionMode.Tenant => "tenant",
        DatabaseExecutionMode.Platform => "platform",
        DatabaseExecutionMode.PlatformOnboarding => "platform_onboarding",
        DatabaseExecutionMode.PlatformSupport => "platform_support",
        DatabaseExecutionMode.PlatformCommercial => "platform_commercial",
        DatabaseExecutionMode.PlatformDirectory => "platform_directory",
        _ => "none"
    };
}

/// <summary>
/// Provee acceso al contexto de ejecución multi-tenant actual (HTTP o proceso en segundo plano)
/// y permite abrir ámbitos explícitos y auditables mediante AsyncLocal.
/// </summary>
public interface ITenantContextAccessor
{
    ExecutionScopeContext Current { get; }

    void SetCurrent(ExecutionScopeContext context);

    IDisposable BeginScope(ExecutionScopeContext context);
}

public sealed class TenantContextAccessor : ITenantContextAccessor
{
    private static readonly AsyncLocal<ExecutionScopeContext?> CurrentScope = new();

    public ExecutionScopeContext Current => CurrentScope.Value ?? ExecutionScopeContext.Anonymous;

    public void SetCurrent(ExecutionScopeContext context)
    {
        ArgumentNullException.ThrowIfNull(context);
        CurrentScope.Value = context;
    }

    public IDisposable BeginScope(ExecutionScopeContext context)
    {
        ArgumentNullException.ThrowIfNull(context);
        var previous = CurrentScope.Value;
        CurrentScope.Value = context;
        return new ScopeResetter(previous);
    }

    private sealed class ScopeResetter(ExecutionScopeContext? previous) : IDisposable
    {
        private bool _disposed;

        public void Dispose()
        {
            if (_disposed)
            {
                return;
            }

            CurrentScope.Value = previous;
            _disposed = true;
        }
    }
}
