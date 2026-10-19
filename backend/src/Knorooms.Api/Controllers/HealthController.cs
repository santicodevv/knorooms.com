using Knorooms.Modules.Common.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Knorooms.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("health")]
public sealed class HealthController(ApplicationDbContext dbContext) : ControllerBase
{
    [HttpGet("live")]
    public IActionResult Live() => Ok(new { status = "Healthy" });

    [HttpGet("ready")]
    public async Task<IActionResult> Ready(CancellationToken cancellationToken)
    {
        var canConnect = await dbContext.Database.CanConnectAsync(cancellationToken);
        return canConnect
            ? Ok(new { status = "Ready", database = "Connected" })
            : StatusCode(StatusCodes.Status503ServiceUnavailable, new { status = "Degraded", database = "Unreachable" });
    }
}
