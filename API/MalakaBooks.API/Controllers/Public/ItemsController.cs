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
    /// Retrieves an item by identifier.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
    {
        var item = await mediator.Send(new GetItemByIdQuery(id), cancellationToken);
        return item is null ? NotFound() : Success(item);
    }
}
