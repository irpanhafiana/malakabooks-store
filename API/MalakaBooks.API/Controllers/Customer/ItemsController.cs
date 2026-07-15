using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.CatalogHandlers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Customer;

/// <summary>
/// Provides authenticated customer read-only endpoints for catalog items.
/// </summary>
/// <param name="mediator">The mediator used to dispatch item queries.</param>
[Route("api/v{version:apiVersion}/customer/[controller]")]
[Authorize(Policy = "MalakaCustomerPolicy")]
public class ItemsController(IMediator mediator) : ApiControllerBase
{
    /// <summary>
    /// Retrieves all items together with their default resolved customer price.
    /// </summary>
    [HttpGet("priced")]
    public async Task<IActionResult> GetPriced(CancellationToken cancellationToken) =>
        Success(await mediator.Send(new GetCustomerPricedItemsQuery(), cancellationToken));

    /// <summary>
    /// Retrieves items by type together with their default resolved customer price.
    /// </summary>
    [HttpGet("priced/type/{itemType}")]
    public async Task<IActionResult> GetPricedByType(string itemType, CancellationToken cancellationToken) =>
        Success(await mediator.Send(new GetCustomerPricedItemsQuery(itemType), cancellationToken));
}
