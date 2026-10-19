using FluentValidation.Results;
using Knorooms.Api.Security;
using Knorooms.SharedKernel.Results;
using Microsoft.AspNetCore.Mvc;

namespace Knorooms.Api.Common;

public static class ApiResultExtensions
{
    public static Guid GetAuthenticatedUserId(this HttpContext httpContext)
    {
        if (httpContext.Items[TenantAndIdentityResolutionMiddleware.IdentityHttpContextItemKey]
            is AuthenticatedRequestIdentity identity)
        {
            return identity.UserId;
        }

        throw new InvalidOperationException("Authenticated identity was not resolved in HttpContext.");
    }

    public static ActionResult ToValidationProblem(this ControllerBase controller, ValidationResult validationResult)
    {
        var errors = validationResult.Errors
            .GroupBy(e => string.IsNullOrWhiteSpace(e.PropertyName) ? "request" : char.ToLowerInvariant(e.PropertyName[0]) + e.PropertyName[1..])
            .ToDictionary(
                g => g.Key,
                g => g.Select(e => e.ErrorMessage).Distinct().ToArray());

        var details = new ValidationProblemDetails(errors)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Validation Failed",
            Detail = "Uno o más campos de la solicitud contienen errores de validación.",
            Type = "https://knorooms.com/problems/validation-error",
            Instance = controller.HttpContext.Request.Path
        };
        details.Extensions["traceId"] = controller.HttpContext.TraceIdentifier;

        return controller.BadRequest(details);
    }

    public static ActionResult ToProblemResult(this ControllerBase controller, Error error)
    {
        var statusCode = error.Type switch
        {
            ErrorType.Validation => StatusCodes.Status400BadRequest,
            ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
            ErrorType.Forbidden => StatusCodes.Status403Forbidden,
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            ErrorType.Locked => StatusCodes.Status423Locked,
            _ => StatusCodes.Status500InternalServerError
        };

        var problem = new ProblemDetails
        {
            Status = statusCode,
            Title = error.Code,
            Detail = error.Description,
            Type = $"https://knorooms.com/problems/{error.Code.ToLowerInvariant().Replace('.', '-')}",
            Instance = controller.HttpContext.Request.Path
        };
        problem.Extensions["traceId"] = controller.HttpContext.TraceIdentifier;

        return controller.StatusCode(statusCode, problem);
    }
}
