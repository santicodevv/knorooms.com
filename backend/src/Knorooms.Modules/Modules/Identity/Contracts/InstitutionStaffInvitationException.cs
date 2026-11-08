using System;
using Knorooms.SharedKernel.Results;

namespace Knorooms.Modules.Modules.Identity.Contracts;

public sealed class InstitutionStaffInvitationException : Exception
{
    public InstitutionStaffInvitationException(Error error)
        : base(error.Description)
    {
        ArgumentNullException.ThrowIfNull(error);
        Error = error;
    }

    public Error Error { get; }
}
