using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Knorooms.SharedKernel.Domain;

namespace Knorooms.Modules.Modules.Identity.Contracts;

public sealed record CreateInstitutionStaffInvitationCommand(
    string Email,
    IReadOnlyCollection<Guid> RoleIds);

public sealed record AcceptInstitutionStaffInvitationCommand(
    Guid InvitationId,
    string Token,
    string DisplayName,
    string Password);

public sealed record InstitutionStaffInvitationDto(
    Guid Id,
    Guid TenantId,
    string Email,
    DateTimeOffset ExpiresAtUtc,
    DateTimeOffset? AcceptedAtUtc,
    DateTimeOffset? RevokedAtUtc,
    string DeliveryStatus,
    IReadOnlyCollection<Guid> RoleIds);

public sealed record InstitutionStaffInvitationQueued(
    Guid EventId,
    DateTimeOffset OccurredOnUtc,
    Guid TenantId,
    Guid InvitationId,
    string TenantSlug) : IDomainEvent
{
    Guid? IDomainEvent.TenantId => TenantId;
}

public interface IInstitutionStaffInvitationService
{
    Task<InstitutionStaffInvitationDto> CreateAsync(
        CreateInstitutionStaffInvitationCommand command,
        Guid actorUserId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<InstitutionStaffInvitationDto>> ListAsync(
        CancellationToken cancellationToken = default);

    Task RevokeAsync(
        Guid invitationId,
        Guid actorUserId,
        CancellationToken cancellationToken = default);

    Task ResendAsync(
        Guid invitationId,
        Guid actorUserId,
        CancellationToken cancellationToken = default);

    Task DeliverAsync(
        InstitutionStaffInvitationQueued message,
        CancellationToken cancellationToken = default);

    Task AcceptAsync(
        AcceptInstitutionStaffInvitationCommand command,
        CancellationToken cancellationToken = default);
}
