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

    /// <summary>
    /// Retrieves an item together with its default resolved customer price by identifier.
    /// </summary>
    [HttpGet("priced/{id}")]
    public async Task<IActionResult> GetPricedById(string id, CancellationToken cancellationToken)
    {
        var item = await mediator.Send(new GetCustomerPricedItemByIdQuery(id), cancellationToken);
        return item is null ? NotFound() : Success(item);
    }

    /// <summary>
    /// Retrieves an autofill item list.
    /// </summary>
    [HttpGet("autofill")]
    public async Task<IActionResult> GetAutofill([FromQuery] string? search, CancellationToken cancellationToken) =>
        Success(await mediator.Send(new GetItemAutofillQuery(search), cancellationToken));
}
