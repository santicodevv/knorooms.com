using Knorooms.Modules.Modules.Identity.Contracts;
using Knorooms.SharedKernel.Results;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Knorooms.Api.Security;

internal sealed class InstitutionStaffInvitationExceptionHandler(
    IProblemDetailsService problems) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext context,
        Exception exception,
        CancellationToken cancellationToken)
    {
        if (exception is not InstitutionStaffInvitationException invitation)
            return false;

        var status = invitation.Error.Type switch
        {
            ErrorType.Validation => StatusCodes.Status400BadRequest,
            ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
            ErrorType.Forbidden => StatusCodes.Status403Forbidden,
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            ErrorType.Locked => StatusCodes.Status423Locked,
            _ => StatusCodes.Status500InternalServerError
        };

        context.Response.StatusCode = status;

        await problems.WriteAsync(new ProblemDetailsContext
        {
            HttpContext = context,
            ProblemDetails = new ProblemDetails
            {
                Status = status,
                Title = invitation.Error.Code,
                Detail = invitation.Error.Description,
                Extensions =
                {
                    ["traceId"] = context.TraceIdentifier
                }
            }
        });

        return true;
    }
}
