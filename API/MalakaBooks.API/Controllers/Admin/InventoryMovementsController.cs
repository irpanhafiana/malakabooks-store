using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.InventoryMovementHandlers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Admin;

/// <summary>
/// Provides API endpoints for administrators to inspect inventory movement history for audit purposes.
/// </summary>
/// <remarks>This controller exposes read-only inventory movement data and supports optional filtering by book identifier.</remarks>
[Route("api/v{version:apiVersion}/admin/[controller]")]
[Authorize(Policy = "MalakaAdminPolicy")]
public class InventoryMovementsController : ApiControllerBase
{
    private readonly IMediator _mediator;

    /// <summary>
    /// Initializes a new instance of the <see cref="InventoryMovementsController"/> class.
    /// </summary>
    /// <param name="mediator">The mediator used to send inventory movement queries.</param>
    public InventoryMovementsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Gets inventory movements, optionally filtered by book identifier.
    /// </summary>
    /// <param name="bookId">The optional book identifier used to filter movement history.</param>
    /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
    /// <returns>An <see cref="IActionResult"/> containing the inventory movement records.</returns>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? bookId, CancellationToken cancellationToken) =>
        Success(await _mediator.Send(new GetInventoryMovementsQuery(bookId), cancellationToken));
}
