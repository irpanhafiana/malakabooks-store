using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.CatalogHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Customer;

/// <summary>
/// Provides authenticated customer price-lookup endpoints.
/// </summary>
/// <param name="mediator">The mediator used to dispatch pricing queries.</param>
[Route("api/v{version:apiVersion}/customer/[controller]")]
[Authorize(Policy = "MalakaCustomerPolicy")]
public class PricingsController(IMediator mediator) : ApiControllerBase
{
    /// <summary>
    /// Resolves the active price for an item and UoM using the authenticated customer's IS4 customer-group claim.
    /// </summary>
    [HttpPost("lookup")]
    public async Task<IActionResult> Lookup([FromBody] CustomerPriceLookupRequest request, CancellationToken cancellationToken)
    {
        var pricing = await mediator.Send(new GetCustomerPriceQuery(request), cancellationToken);
        return pricing is null ? NotFound() : Success(pricing);
    }
}
