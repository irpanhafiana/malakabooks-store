using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.CatalogHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Admin;

/// <summary>
/// Provides administrative endpoints for managing unit-of-measure groups.
/// </summary>
/// <param name="mediator">The mediator used to dispatch UoM group commands and queries.</param>
[Route("api/v{version:apiVersion}/admin/[controller]")]
[Authorize(Policy = "MalakaAdminPolicy")]
public class UomGroupsController(IMediator mediator) : ApiControllerBase
{
    /// <summary>
    /// Retrieves all UoM groups.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Success(await mediator.Send(new GetUomGroupsQuery(), cancellationToken));

    /// <summary>
    /// Retrieves a UoM group by identifier.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
    {
        var uomGroup = await mediator.Send(new GetUomGroupByIdQuery(id), cancellationToken);
        return uomGroup is null ? NotFound() : Success(uomGroup);
    }

    /// <summary>
    /// Creates a new UoM group.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUomGroupRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CreateUomGroupCommand(request), cancellationToken);
        return Success(result);
    }

    /// <summary>
    /// Updates an existing UoM group.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateUomGroupRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new UpdateUomGroupCommand(id, request), cancellationToken);
        return Success(result);
    }

    /// <summary>
    /// Deletes a UoM group.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken) =>
        Success(await mediator.Send(new DeleteUomGroupCommand(id), cancellationToken));
}
