using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.CategoryHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Admin;

/// <summary>
/// Represents an API controller that manages category resources for administrative operations.
/// </summary>
/// <remarks>This controller provides endpoints for creating, retrieving, updating, and deleting categories. All
/// actions are intended for administrative use and are versioned via the API route. Authorization policies may be
/// applied to restrict access to administrative users.</remarks>
/// <param name="mediator">The mediator used to send commands and queries related to category operations.</param>
[Route("api/v{version:apiVersion}/admin/[controller]")]
[Authorize(Policy = "MalakaAdminPolicy")]
public class CategoriesController(IMediator mediator) : ApiControllerBase
{
  /// <summary>Get all categories</summary>
  [HttpGet]
  public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
      Success(await mediator.Send(new GetCategoriesQuery(), cancellationToken));

  /// <summary>Get category by id</summary>
  [HttpGet("{id}")]
  public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
  {
    var category = await mediator.Send(new GetCategoryByIdQuery(id), cancellationToken);
    return Success(category);
  }

  /// <summary>Create category</summary>
  [HttpPost]
  public async Task<IActionResult> Create([FromBody] CreateCategoryRequest request, CancellationToken cancellationToken)
  {
    var result = await mediator.Send(new CreateCategoryCommand(request), cancellationToken);
    return ProcessResult(result);
  }

  /// <summary>Update category</summary>
  [HttpPut("{id}")]
  public async Task<IActionResult> Update(string id, [FromBody] UpdateCategoryRequest request, CancellationToken cancellationToken)
  {
    var result = await mediator.Send(new UpdateCategoryCommand(id, request), cancellationToken);
    return Success(result);
  }

  /// <summary>Delete category</summary>
  [HttpDelete("{id}")]
  public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
       => Success(await mediator.Send(new DeleteCategoryCommand(id), cancellationToken));
}
