using FluentValidation;
using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.CategoryHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Admin;

[Route("api/v{version:apiVersion}/admin/[controller]")]
[Authorize(Policy = "AdminPolicy")]
public class CategoriesController(
    IMediator mediator,
    IValidator<CreateCategoryRequest> createValidator,
    IValidator<UpdateCategoryRequest> updateValidator) : ApiControllerBase
{
    /// <summary>Get all categories</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<CategoryResponse>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await mediator.Send(new GetCategoriesQuery(), cancellationToken));

    /// <summary>Get category by id</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryResponse>> GetById(string id, CancellationToken cancellationToken)
    {
        var category = await mediator.Send(new GetCategoryByIdQuery(id), cancellationToken);
        return category is null ? NotFound() : Ok(category);
    }

    /// <summary>Create category</summary>
    [HttpPost]
    public async Task<ActionResult<CategoryResponse>> Create([FromBody] CreateCategoryRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await createValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
            return ProcessResult(validationResult);

        var category = await mediator.Send(new CreateCategoryCommand(request), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = category.Id, version = HttpContext.GetRequestedApiVersion()?.ToString() ?? "1.0" }, category);
    }

    /// <summary>Update category</summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<CategoryResponse>> Update(string id, [FromBody] UpdateCategoryRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await updateValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
            return ProcessResult(validationResult);

        var category = await mediator.Send(new UpdateCategoryCommand(id, request), cancellationToken);
        return category is null ? NotFound() : Ok(category);
    }

    /// <summary>Delete category</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken) =>
        await mediator.Send(new DeleteCategoryCommand(id), cancellationToken) ? NoContent() : NotFound();
}
