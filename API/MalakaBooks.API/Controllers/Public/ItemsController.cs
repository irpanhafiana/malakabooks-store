using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.CatalogHandlers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Public;

/// <summary>
/// Provides public read-only endpoints for generic catalog items.
/// </summary>
/// <param name="mediator">The mediator used to dispatch item queries.</param>
[Route("api/v{version:apiVersion}/public/[controller]")]
[AllowAnonymous]
public class ItemsController(IMediator mediator) : ApiControllerBase
{
    /// <summary>
    /// Retrieves all items.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Success(await mediator.Send(new GetItemsQuery(), cancellationToken));

    /// <summary>
    /// Retrieves items filtered by item type.
    /// </summary>
    [HttpGet("type/{itemType}")]
    public async Task<IActionResult> GetByType(string itemType, CancellationToken cancellationToken) =>
        Success(await mediator.Send(new GetItemsByTypeQuery(itemType), cancellationToken));

    /// <summary>
    /// Retrieves all items together with their default resolved public price.
    /// </summary>
    [HttpGet("priced")]
    public async Task<IActionResult> GetPriced(CancellationToken cancellationToken) =>
        Success(await mediator.Send(new GetPublicPricedItemsQuery(), cancellationToken));

    /// <summary>
    /// Retrieves items by type together with their default resolved public price.
    /// </summary>
    [HttpGet("priced/type/{itemType}")]
    public async Task<IActionResult> GetPricedByType(string itemType, CancellationToken cancellationToken) =>
        Success(await mediator.Send(new GetPublicPricedItemsQuery(itemType), cancellationToken));

    /// <summary>
    /// Retrieves an item together with its default resolved public price by identifier.
    /// </summary>
    [HttpGet("priced/{id}")]
    public async Task<IActionResult> GetPricedById(string id, CancellationToken cancellationToken)
    {
        var item = await mediator.Send(new GetPublicPricedItemByIdQuery(id), cancellationToken);
        return item is null ? NotFound() : Success(item);
    }

    /// <summary>
    /// Retrieves an autofill item list.
    /// </summary>
    [HttpGet("autofill")]
    public async Task<IActionResult> GetAutofill([FromQuery] string? search, CancellationToken cancellationToken) =>
        Success(await mediator.Send(new GetItemAutofillQuery(search), cancellationToken));

    /// <summary>
    /// Retrieves an item by identifier.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
    {
        var item = await mediator.Send(new GetItemByIdQuery(id), cancellationToken);
        return item is null ? NotFound() : Success(item);
    }
}
