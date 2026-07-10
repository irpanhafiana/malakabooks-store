using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.CatalogHandlers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Public;

/// <summary>
/// Provides public read-only endpoints for warehouse stock records.
/// </summary>
/// <param name="mediator">The mediator used to dispatch warehouse stock queries.</param>
[Route("api/v{version:apiVersion}/public/[controller]")]
[AllowAnonymous]
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
}
