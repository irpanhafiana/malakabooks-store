using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.CategoryHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Public;

[Route("api/v{version:apiVersion}/public/[controller]")]
public class CategoriesController(IMediator mediator) : ApiControllerBase
{
    /// <summary>Get all categories (public)</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<CategoryResponse>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await mediator.Send(new GetCategoriesQuery(), cancellationToken));

    /// <summary>Get category by id (public)</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryResponse>> GetById(string id, CancellationToken cancellationToken)
    {
        var category = await mediator.Send(new GetCategoryByIdQuery(id), cancellationToken);
        return category is null ? NotFound() : Ok(category);
    }
}
