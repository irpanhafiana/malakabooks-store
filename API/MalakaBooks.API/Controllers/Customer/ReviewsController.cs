using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.ReviewHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Customer;
/// <summary>
/// Handles review-related API requests for customers, including retrieving reviews for a specific item and creating new
/// reviews.
/// </summary>
/// <param name="mediator">The mediator used to send commands and queries related to reviews.</param>
[Route("api/v{version:apiVersion}/customer/[controller]")]
[Authorize(Policy = "MalakaCustomerPolicy")]
public class ReviewsController(IMediator mediator) : ApiControllerBase
{
    /// <summary>Get reviews by item</summary>
    [HttpGet("items/{itemId}")]
    public async Task<IActionResult> GetByItem(string itemId, CancellationToken cancellationToken) =>
        Success(await mediator.Send(new GetReviewsByItemQuery(itemId), cancellationToken));

    /// <summary>Write a review</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReviewRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CreateReviewCommand(request), cancellationToken);
        return ProcessResult(result);
    }
}
