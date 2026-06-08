using FluentValidation;
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
/// <param name="createValidator">The validator used to validate requests for creating categories.</param>
/// <param name="updateValidator">The validator used to validate requests for updating categories.</param>
[Route("api/v{version:apiVersion}/admin/[controller]")]
[Authorize(Policy = "MalakaAdminPolicy")]
public class CategoriesController(
    IMediator mediator,
    IValidator<CreateCategoryRequest> createValidator,
    IValidator<UpdateCategoryRequest> updateValidator) : ApiControllerBase
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
    return category is null ? NotFound() : Success(category);
  }

  /// <summary>Create category</summary>
  [HttpPost]
  public async Task<IActionResult> Create([FromBody] CreateCategoryRequest request, CancellationToken cancellationToken)
  {
    var validationResult = await createValidator.ValidateAsync(request, cancellationToken);
    if (!validationResult.IsValid)
      return ProcessResult(validationResult);

    var category = await mediator.Send(new CreateCategoryCommand(request), cancellationToken);
    return CreatedAtAction(nameof(GetById), new { id = category.Id, version = HttpContext.GetRequestedApiVersion()?.ToString() ?? "1.0" }, category);
  }

  /// <summary>Update category</summary>
  [HttpPut("{id}")]
  public async Task<IActionResult> Update(string id, [FromBody] UpdateCategoryRequest request, CancellationToken cancellationToken)
  {
    var validationResult = await updateValidator.ValidateAsync(request, cancellationToken);
    if (!validationResult.IsValid)
      return ProcessResult(validationResult);

    var category = await mediator.Send(new UpdateCategoryCommand(id, request), cancellationToken);
    return category is null ? NotFound() : Success(category);
  }

  /// <summary>Delete category</summary>
  [HttpDelete("{id}")]
  public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken) =>
      await mediator.Send(new DeleteCategoryCommand(id), cancellationToken) ? NoContent() : NotFound();
}
