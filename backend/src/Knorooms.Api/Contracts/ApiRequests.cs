using FluentValidation;
using Knorooms.SharedKernel.Tenancy;

namespace Knorooms.Api.Contracts;

public sealed record CreateInstitutionRequest(string Slug, string Name);

public sealed record AssignInstitutionAdministratorRequest(string Email);

public sealed record CreateSupportAccessRequest(
    Guid TenantId,
    string Reason,
    IReadOnlyList<string> Permissions,
    int DurationMinutes = 240);

public sealed class CreateInstitutionRequestValidator : AbstractValidator<CreateInstitutionRequest>
{
    public CreateInstitutionRequestValidator()
    {
        RuleFor(x => x.Slug)
            .NotEmpty().WithMessage("El subdominio (slug) es obligatorio.")
            .MaximumLength(63)
            .Must(HostSubdomainParser.IsValidTenantSlug)
            .WithMessage("El subdominio debe usar minúsculas, números o guiones y no ser un subdominio reservado.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre del colegio es obligatorio.")
            .MinimumLength(3)
            .MaximumLength(160);
    }
}

public sealed class AssignInstitutionAdministratorRequestValidator : AbstractValidator<AssignInstitutionAdministratorRequest>
{
    public AssignInstitutionAdministratorRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("El correo electrónico es obligatorio.")
            .EmailAddress().WithMessage("El formato del correo electrónico no es válido.")
            .MaximumLength(254);
    }
}

public sealed class CreateSupportAccessRequestValidator : AbstractValidator<CreateSupportAccessRequest>
{
    public CreateSupportAccessRequestValidator()
    {
        RuleFor(x => x.TenantId)
            .NotEmpty().WithMessage("Debe indicar la institución (TenantId).");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("El motivo de la solicitud de soporte es obligatorio.")
            .MinimumLength(10)
            .MaximumLength(500);

        RuleFor(x => x.Permissions)
            .NotEmpty().WithMessage("Debe solicitar al menos un permiso institucional.");

        RuleFor(x => x.DurationMinutes)
            .InclusiveBetween(15, 480)
            .WithMessage("La duración del acceso temporal debe estar entre 15 y 480 minutos.");
    }
}
