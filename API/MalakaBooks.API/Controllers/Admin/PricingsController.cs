using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.CatalogHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Admin;

/// <summary>
/// Provides administrative endpoints for managing pricing masters.
/// </summary>
/// <param name="mediator">The mediator used to dispatch pricing commands and queries.</param>
[Route("api/v{version:apiVersion}/admin/[controller]")]
[Authorize(Policy = "MalakaAdminPolicy")]
public class PricingsController(IMediator mediator) : ApiControllerBase
{
    /// <summary>
    /// Retrieves all pricing masters.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Success(await mediator.Send(new GetPricingsQuery(), cancellationToken));

    /// <summary>
    /// Retrieves a pricing master by identifier.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
    {
        var pricing = await mediator.Send(new GetPricingByIdQuery(id), cancellationToken);
        return pricing is null ? NotFound() : Success(pricing);
    }

    /// <summary>
    /// Creates a new pricing master.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePricingRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CreatePricingCommand(request), cancellationToken);
        return Success(result);
    }

    /// <summary>
    /// Updates an existing pricing master.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdatePricingRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new UpdatePricingCommand(id, request), cancellationToken);
        return Success(result);
    }

    /// <summary>
    /// Deletes a pricing master.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken) =>
        Success(await mediator.Send(new DeletePricingCommand(id), cancellationToken));
}
