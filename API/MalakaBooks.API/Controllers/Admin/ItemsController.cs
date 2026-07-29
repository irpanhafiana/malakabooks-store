using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.CatalogHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Admin;

/// <summary>
/// Provides administrative endpoints for managing generic catalog items.
/// </summary>
/// <param name="mediator">The mediator used to dispatch item commands and queries.</param>
[Route("api/v{version:apiVersion}/admin/[controller]")]
[Authorize(Policy = "MalakaAdminPolicy")]
public class ItemsController(IMediator mediator) : ApiControllerBase
{
    /// <summary>
    /// Retrieves all items.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Success(await mediator.Send(new GetItemsQuery(), cancellationToken));

    /// <summary>
    /// Retrieves an item by identifier.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
    {
        var item = await mediator.Send(new GetItemByIdQuery(id), cancellationToken);
        return item is null ? NotFound() : Success(item);
    }

    /// <summary>
    /// Creates a new item.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateItemRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CreateItemCommand(request), cancellationToken);
        return Success(result);
    }

    /// <summary>
    /// Creates a new item with image files.
    /// </summary>
    [HttpPost("with-files")]
    public async Task<IActionResult> CreateWithFiles([FromForm] CreateItemWithFilesRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CreateItemWithFilesCommand(request), cancellationToken);
        return Success(result);
    }

    /// <summary>
    /// Updates an existing item.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateItemRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new UpdateItemCommand(id, request), cancellationToken);
        return Success(result);
    }

    /// <summary>
    /// Updates an existing item with image files.
    /// </summary>
    [HttpPut("{id}/with-files")]
    public async Task<IActionResult> UpdateWithFiles(string id, [FromForm] UpdateItemWithFilesRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new UpdateItemWithFilesCommand(id, request), cancellationToken);
        return Success(result);
    }

    /// <summary>
    /// Deletes an item.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken) =>
        Success(await mediator.Send(new DeleteItemCommand(id), cancellationToken));
}
