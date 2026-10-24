using Knorooms.SharedKernel.Results;
namespace Knorooms.Modules.Modules.Entitlements.Contracts;

public sealed record ProductModuleDto(string Code, string Name, string[] Dependencies, bool Available);
public sealed record ModuleAccessDto(string Code, string Name, bool CanRead, bool CanWrite, string? Reason);
public sealed record EffectiveAccessDto(string Status, DateTimeOffset? EndsAtUtc, int? MaxActiveStudents, int? MaxSections, IReadOnlyList<ModuleAccessDto> Modules);
public interface IEntitlementService
{
    Task<EffectiveAccessDto> GetCurrentAsync(CancellationToken cancellationToken = default);
    Task<Result> EnsureCanWriteAsync(string moduleCode, CancellationToken cancellationToken = default);
}
public static class ProductModuleCatalog
{
    public static readonly IReadOnlyList<ProductModuleDto> All = [
        new("students", "Estudiantes y responsables", [], true),
        new("academic", "Organización académica", [], true),
        new("enrollments", "Matrículas", ["students", "academic"], true),
        new("attendance", "Asistencia", ["enrollments"], true),
        new("grading", "Evaluación", ["enrollments"], true),
        new("reportcards", "Boletas", ["grading"], true),
        new("moodle", "Integración Moodle", ["enrollments", "grading"], false)
    ];
    public static bool IsValidSelection(IEnumerable<string> modules)
    {
        var set = modules.ToHashSet(StringComparer.Ordinal);
        return set.All(code => All.Any(m => m.Code == code && m.Dependencies.All(set.Contains)));
    }
    public static IReadOnlyList<ModuleAccessDto> Resolve(IEnumerable<string> enabled, string status)
    {
        var set = enabled.ToHashSet(StringComparer.Ordinal);
        bool Available(string code) => status == "Active" && set.Contains(code)
            && All.First(m => m.Code == code).Available
            && All.First(m => m.Code == code).Dependencies.All(Available);
        return All.Select(m => new ModuleAccessDto(m.Code, m.Name, m.Available, Available(m.Code),
            !m.Available ? "Disponible en una próxima etapa." : status != "Active" ? "Suscripción sin vigencia activa. Consulta histórica disponible."
            : !set.Contains(m.Code) ? "Módulo no habilitado para este colegio."
            : !Available(m.Code) ? "Falta habilitar un módulo requerido." : null)).ToArray();
    }
}
public sealed class CommercialAccessException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}
