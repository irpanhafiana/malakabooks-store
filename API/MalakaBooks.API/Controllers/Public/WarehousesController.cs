using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.CatalogHandlers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Public;

/// <summary>
/// Provides public read-only endpoints for warehouses.
/// </summary>
/// <param name="mediator">The mediator used to dispatch warehouse queries.</param>
[Route("api/v{version:apiVersion}/public/[controller]")]
[AllowAnonymous]
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
}
