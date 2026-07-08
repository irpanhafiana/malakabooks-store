using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.PromotionBannerHandlers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Public;

/// <summary>
/// Represents an API controller that provides public endpoints for active promotion banners.
/// </summary>
/// <param name="mediator">The mediator used to send queries for retrieving promotion banner data.</param>
[Route("api/v{version:apiVersion}/public/[controller]")]
[AllowAnonymous]
public class PromotionBannersController(IMediator mediator) : ApiControllerBase
{
    /// <summary>Get active promotion banners (public)</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Success(await mediator.Send(new GetActivePromotionBannersQuery(), cancellationToken));
}
