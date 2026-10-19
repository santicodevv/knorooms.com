using Knorooms.Api.Common;
using Knorooms.Modules.Modules.Identity.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Knorooms.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/me")]
public sealed class MeController(IIdentityService identityService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<CurrentUserProfileDto>> GetMe(CancellationToken cancellationToken)
    {
        var userId = HttpContext.GetAuthenticatedUserId();
        var profile = await identityService.GetCurrentUserProfileAsync(userId, cancellationToken);
        if (profile is null)
        {
            return Unauthorized();
        }

        return Ok(profile);
    }
}
