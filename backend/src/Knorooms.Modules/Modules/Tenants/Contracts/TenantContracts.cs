namespace Knorooms.Modules.Modules.Tenants.Contracts;

public sealed record InstitutionDto(
    Guid Id,
    string Slug,
    string Name,
    string Status,
    DateTimeOffset CreatedAt);

public interface ITenantLookupService
{
    Task<InstitutionDto?> FindBySlugAsync(string slug, CancellationToken cancellationToken = default);
}
