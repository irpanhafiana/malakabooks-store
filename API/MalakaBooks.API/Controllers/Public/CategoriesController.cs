using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.CategoryHandlers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Public;
/// <summary>
/// Represents an API controller that provides public endpoints for retrieving category information.
/// </summary>
/// <remarks>This controller exposes public endpoints for accessing category data. All routes are versioned and
/// accessible under the 'public' API segment. The controller is intended for read-only access to category information
/// and does not provide endpoints for creating, updating, or deleting categories.</remarks>
/// <param name="mediator">The mediator used to send queries for retrieving category data.</param>
[Route("api/v{version:apiVersion}/public/[controller]")]
[AllowAnonymous]
public class CategoriesController(IMediator mediator) : ApiControllerBase
{
  /// <summary>Get all categories (public)</summary>
  [HttpGet]
  public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
      Success(await mediator.Send(new GetCategoriesQuery(), cancellationToken));

  /// <summary>Get category by id (public)</summary>
  [HttpGet("{id}")]
  public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
  {
    var category = await mediator.Send(new GetCategoryByIdQuery(id), cancellationToken);
    return category is null ? NotFound() : Success(category);
  }
}
