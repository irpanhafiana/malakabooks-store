using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.CatalogHandlers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Public;

/// <summary>
/// Provides public read-only endpoints for unit-of-measure groups.
/// </summary>
/// <param name="mediator">The mediator used to dispatch UoM group queries.</param>
[Route("api/v{version:apiVersion}/public/[controller]")]
[AllowAnonymous]
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
}
