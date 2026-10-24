using Knorooms.Modules.Modules.Entitlements.Contracts;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
namespace Knorooms.Api.Security;

internal sealed class CommercialExceptionHandler(IProblemDetailsService problems) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        if (exception is not CommercialAccessException commercial) return false;
        context.Response.StatusCode = 403;
        await problems.WriteAsync(new ProblemDetailsContext
        {
            HttpContext = context,
            ProblemDetails = new ProblemDetails
            { Status = 403, Title = commercial.Code, Detail = commercial.Message, Extensions = { ["traceId"] = context.TraceIdentifier } }
        });
        return true;
    }
}
