using FluentValidation;
using Knorooms.Api.Common;
using Knorooms.Api.Contracts;
using Knorooms.Modules.Modules.Identity.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Knorooms.Api.Controllers;

/// <summary>
/// Endpoints de autenticación propios de KNOROOMS. El backend emite sus propios JWT
/// (Authorization Code no aplica; no hay proveedor externo). Estos endpoints son invocados
/// exclusivamente por el BFF de Next.js, nunca directamente por el navegador.
/// </summary>
[ApiController]
[AllowAnonymous]
[Route("api/auth")]
public sealed class AuthController(
    IIdentityService identityService,
    IValidator<LoginRequest> loginValidator,
    IValidator<RefreshTokenRequest> refreshValidator) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<IssuedTokensDto>> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        var validation = await loginValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return this.ToValidationProblem(validation);
        }

        var issued = await identityService.LoginWithPasswordAsync(
            request.Email,
            request.Password,
            cancellationToken);

        if (issued is null)
        {
            return UnauthorizedProblem(
                "Credenciales inválidas",
                "El correo electrónico o la contraseña no son correctos, o la cuenta está bloqueada.");
        }

        return Ok(issued);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<IssuedTokensDto>> Refresh(
        [FromBody] RefreshTokenRequest request,
        CancellationToken cancellationToken)
    {
        var validation = await refreshValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return this.ToValidationProblem(validation);
        }

        var issued = await identityService.RefreshTokensAsync(request.RefreshToken, cancellationToken);
        if (issued is null)
        {
            return UnauthorizedProblem(
                "Refresh token inválido",
                "El refresh token está vencido, fue revocado o no es válido.");
        }

        return Ok(issued);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(
        [FromBody] RefreshTokenRequest request,
        CancellationToken cancellationToken)
    {
        var validation = await refreshValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return this.ToValidationProblem(validation);
        }

        await identityService.RevokeRefreshTokenAsync(request.RefreshToken, cancellationToken);
        return NoContent();
    }

    private ActionResult UnauthorizedProblem(string title, string detail)
    {
        var problem = new ProblemDetails
        {
            Status = StatusCodes.Status401Unauthorized,
            Title = title,
            Detail = detail,
            Type = "https://knorooms.com/problems/invalid-credentials",
            Instance = HttpContext.Request.Path
        };
        problem.Extensions["traceId"] = HttpContext.TraceIdentifier;

        return new ObjectResult(problem) { StatusCode = StatusCodes.Status401Unauthorized };
    }
}
