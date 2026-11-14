using Knorooms.Api.Common;
using Knorooms.Api.Contracts;
using Knorooms.Modules.Modules.Files.Contracts;
using Knorooms.SharedKernel.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Knorooms.Api.Controllers;

[ApiController]
[Route("api/tenant/files")]
public sealed class FilesController(
    IStoredFileService storedFileService) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = PermissionCatalog.InstitutionFilesManage)]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<StoredFileDto>> UploadFile(
        [FromForm] IFormFile? file,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest("Debes seleccionar un archivo válido.");
        }

        var actorUserId = HttpContext.GetAuthenticatedUserId();

        await using var stream = file.OpenReadStream();

        var result = await storedFileService.UploadAsync(
            actorUserId,
            file.FileName,
            stream,
            cancellationToken);

        return result.IsSuccess
            ? StatusCode(StatusCodes.Status201Created, result.Value)
            : this.ToProblemResult(result.Error);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = PermissionCatalog.InstitutionFilesRead)]
    public async Task<IActionResult> DownloadFile(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await storedFileService.DownloadAsync(
            id,
            cancellationToken);

        if (result.IsFailure)
        {
            return this.ToProblemResult(result.Error);
        }

        return File(
            result.Value.Content,
            result.Value.ContentType,
            result.Value.OriginalFileName);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = PermissionCatalog.InstitutionFilesManage)]
    public async Task<IActionResult> DeleteFile(
        Guid id,
        CancellationToken cancellationToken)
    {
        var actorUserId = HttpContext.GetAuthenticatedUserId();

        var result = await storedFileService.DeleteAsync(
            actorUserId,
            id,
            cancellationToken);

        return result.IsSuccess
            ? NoContent()
            : this.ToProblemResult(result.Error);
    }
}
