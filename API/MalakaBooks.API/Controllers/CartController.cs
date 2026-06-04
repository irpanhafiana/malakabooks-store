using FluentValidation;
using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.CartHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers;

public class CartController(
    IMediator mediator,
    IValidator<AddCartItemRequest> addValidator,
    IValidator<RemoveCartItemRequest> removeValidator) : ApiControllerBase
{
    [HttpGet("{userId}")]
    public async Task<ActionResult<CartResponse>> GetCart(string userId, CancellationToken cancellationToken) =>
        Ok(await mediator.Send(new GetCartQuery(userId), cancellationToken));

    [HttpPost]
    public async Task<ActionResult<CartResponse>> AddItem([FromBody] AddCartItemRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await addValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return ProcessResult(validationResult);
        }

        return Ok(await mediator.Send(new AddCartItemCommand(request), cancellationToken));
    }

    [HttpDelete("{userId}/items/{bookId}")]
    public async Task<ActionResult<CartResponse>> RemoveItem(string userId, string bookId, CancellationToken cancellationToken)
    {
        var request = new RemoveCartItemRequest { UserId = userId, BookId = bookId };
        var validationResult = await removeValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return ProcessResult(validationResult);
        }

        return Ok(await mediator.Send(new RemoveCartItemCommand(request), cancellationToken));
    }
}
