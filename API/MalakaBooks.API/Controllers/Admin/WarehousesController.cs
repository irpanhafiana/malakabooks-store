using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.CatalogHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Admin;

/// <summary>
/// Provides administrative endpoints for managing warehouses.
/// </summary>
/// <param name="mediator">The mediator used to dispatch warehouse commands and queries.</param>
[Route("api/v{version:apiVersion}/admin/[controller]")]
[Authorize(Policy = "MalakaAdminPolicy")]
public class WarehousesController(IMediator mediator) : ApiControllerBase
{
    /// <summary>
    /// Retrieves all warehouses.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Success(await mediator.Send(new GetWarehousesQuery(), cancellationToken));

    /// <summary>
    /// Retrieves a warehouse by identifier.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
    {
        var warehouse = await mediator.Send(new GetWarehouseByIdQuery(id), cancellationToken);
        return warehouse is null ? NotFound() : Success(warehouse);
    }

    /// <summary>
    /// Creates a new warehouse.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWarehouseRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CreateWarehouseCommand(request), cancellationToken);
        return Success(result);
    }

    /// <summary>
    /// Updates an existing warehouse.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateWarehouseRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new UpdateWarehouseCommand(id, request), cancellationToken);
        return Success(result);
    }

    /// <summary>
    /// Deletes a warehouse.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken) =>
        Success(await mediator.Send(new DeleteWarehouseCommand(id), cancellationToken));
}
