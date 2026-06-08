using FluentValidation;
using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.CategoryHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers;

public class CategoriesController(
    IMediator mediator,
    IValidator<CreateCategoryRequest> createValidator,
    IValidator<UpdateCategoryRequest> updateValidator) : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<CategoryResponse>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await mediator.Send(new GetCategoriesQuery(), cancellationToken));

    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryResponse>> GetById(string id, CancellationToken cancellationToken)
    {
        var category = await mediator.Send(new GetCategoryByIdQuery(id), cancellationToken);
        return category is null ? NotFound() : Ok(category);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryResponse>> Create([FromBody] CreateCategoryRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await createValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return ProcessResult(validationResult);
        }

        var category = await mediator.Send(new CreateCategoryCommand(request), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = category.Id, version = HttpContext.GetRequestedApiVersion()?.ToString() ?? "1.0" }, category);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CategoryResponse>> Update(string id, [FromBody] UpdateCategoryRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await updateValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return ProcessResult(validationResult);
        }

        var category = await mediator.Send(new UpdateCategoryCommand(id, request), cancellationToken);
        return category is null ? NotFound() : Ok(category);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken) =>
        await mediator.Send(new DeleteCategoryCommand(id), cancellationToken) ? NoContent() : NotFound();
}
