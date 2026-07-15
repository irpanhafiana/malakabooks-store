using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.CategoryHandlers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Customer;

/// <summary>
/// Provides authenticated customer endpoints for retrieving category information.
/// </summary>
/// <param name="mediator">The mediator used to dispatch category queries.</param>
[Route("api/v{version:apiVersion}/customer/[controller]")]
[Authorize(Policy = "MalakaCustomerPolicy")]
public class CategoriesController(IMediator mediator) : ApiControllerBase
{
    /// <summary>
    /// Retrieves all categories.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Success(await mediator.Send(new GetCategoriesQuery(), cancellationToken));

    /// <summary>
    /// Retrieves categories filtered by item type.
    /// </summary>
    [HttpGet("type/{itemType}")]
    public async Task<IActionResult> GetByItemType(string itemType, CancellationToken cancellationToken) =>
        Success(await mediator.Send(new GetCategoriesQuery(itemType), cancellationToken));

    /// <summary>
    /// Retrieves a category by identifier.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
    {
        var category = await mediator.Send(new GetCategoryByIdQuery(id), cancellationToken);
        return category is null ? NotFound() : Success(category);
    }
}
