using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.CatalogHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Admin;

/// <summary>
/// Provides administrative endpoints for managing warehouse stock records.
/// </summary>
/// <param name="mediator">The mediator used to dispatch warehouse stock commands and queries.</param>
[Route("api/v{version:apiVersion}/admin/[controller]")]
[Authorize(Policy = "MalakaAdminPolicy")]
public class WarehouseStocksController(IMediator mediator) : ApiControllerBase
{
    /// <summary>
    /// Retrieves all warehouse stock records.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Success(await mediator.Send(new GetWarehouseStocksQuery(), cancellationToken));

    /// <summary>
    /// Retrieves a warehouse stock record by identifier.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
    {
        var warehouseStock = await mediator.Send(new GetWarehouseStockByIdQuery(id), cancellationToken);
        return warehouseStock is null ? NotFound() : Success(warehouseStock);
    }

    /// <summary>
    /// Creates a new warehouse stock record.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWarehouseStockRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CreateWarehouseStockCommand(request), cancellationToken);
        return Success(result);
    }

    /// <summary>
    /// Updates an existing warehouse stock record.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateWarehouseStockRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new UpdateWarehouseStockCommand(id, request), cancellationToken);
        return Success(result);
    }

    /// <summary>
    /// Deletes a warehouse stock record.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken) =>
        Success(await mediator.Send(new DeleteWarehouseStockCommand(id), cancellationToken));
}
