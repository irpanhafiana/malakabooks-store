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
}
