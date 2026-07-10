using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.CatalogHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Public;

/// <summary>
/// Provides public price-lookup endpoints for product pricing resolution.
/// </summary>
/// <param name="mediator">The mediator used to dispatch pricing queries.</param>
[Route("api/v{version:apiVersion}/public/[controller]")]
[AllowAnonymous]
public class PricingsController(IMediator mediator) : ApiControllerBase
{
    /// <summary>
    /// Resolves the active price for an item and UoM using the configured public default customer group.
    /// </summary>
    [HttpPost("lookup")]
    public async Task<IActionResult> Lookup([FromBody] PublicPriceLookupRequest request, CancellationToken cancellationToken)
    {
        var pricing = await mediator.Send(new GetPublicPriceQuery(request), cancellationToken);
        return pricing is null ? NotFound() : Success(pricing);
    }
}
