using FluentValidation;
using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.ReviewHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Customer;

[Route("api/v{version:apiVersion}/customer/[controller]")]
[Authorize(Policy = "CustomerPolicy")]
public class ReviewsController(
    IMediator mediator,
    IValidator<CreateReviewRequest> createValidator) : ApiControllerBase
{
    /// <summary>Get reviews by book</summary>
    [HttpGet("book/{bookId}")]
    public async Task<ActionResult<IReadOnlyCollection<ReviewResponse>>> GetByBook(string bookId, CancellationToken cancellationToken) =>
        Ok(await mediator.Send(new GetReviewsByBookQuery(bookId), cancellationToken));

    /// <summary>Write a review</summary>
    [HttpPost]
    public async Task<ActionResult<ReviewResponse>> Create([FromBody] CreateReviewRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await createValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
            return ProcessResult(validationResult);

        var review = await mediator.Send(new CreateReviewCommand(request), cancellationToken);
        return CreatedAtAction(nameof(GetByBook), new { bookId = review.BookId, version = HttpContext.GetRequestedApiVersion()?.ToString() ?? "1.0" }, review);
    }
}
