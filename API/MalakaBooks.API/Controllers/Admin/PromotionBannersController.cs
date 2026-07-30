using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.PromotionBannerHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Admin;

/// <summary>
/// Represents an API controller for managing promotion banners in administrative scenarios.
/// </summary>
/// <param name="mediator">The mediator used to dispatch promotion banner commands.</param>
[Route("api/v{version:apiVersion}/admin/[controller]")]
[Authorize(Policy = "MalakaAdminPolicy")]
public class PromotionBannersController(IMediator mediator) : ApiControllerBase
{
    /// <summary>Create promotion banner</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePromotionBannerRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CreatePromotionBannerCommand(request), cancellationToken);
        return ProcessResult(result);
    }

    /// <summary>Create promotion banner with image file</summary>
    [HttpPost("with-files")]
    public async Task<IActionResult> CreateWithFiles([FromForm] CreatePromotionBannerWithFilesRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CreatePromotionBannerWithFilesCommand(request), cancellationToken);
        return ProcessResult(result);
    }

    /// <summary>Update promotion banner</summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdatePromotionBannerRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new UpdatePromotionBannerCommand(id, request), cancellationToken);
        return Success(result);
    }

    /// <summary>Update promotion banner with image file</summary>
    [HttpPut("{id}/with-files")]
    public async Task<IActionResult> UpdateWithFiles(string id, [FromForm] UpdatePromotionBannerWithFilesRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new UpdatePromotionBannerWithFilesCommand(id, request), cancellationToken);
        return Success(result);
    }

    /// <summary>Delete promotion banner</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
        => Success(await mediator.Send(new DeletePromotionBannerCommand(id), cancellationToken));
}
