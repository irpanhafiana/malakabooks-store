using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.CartHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Customer;
/// <summary>
/// Represents an API controller that manages the authenticated customer's shopping cart, including retrieving the cart,
/// adding items, and removing items.
/// </summary>
/// <remarks>All endpoints require the caller to be authorized under the 'CustomerPolicy'. The controller is
/// versioned and accessible under the 'api/v{version}/customer/cart' route. Validation is performed on incoming
/// requests before processing cart modifications.</remarks>
/// <param name="mediator">The mediator used to send commands and queries related to cart operations.</param>
[Route("api/v{version:apiVersion}/customer/[controller]")]
[Authorize(Policy = "MalakaCustomerPolicy")]
public class CartController(IMediator mediator) : ApiControllerBase
{
    /// <summary>Get own cart</summary>
    [HttpGet("{userId}")]
    public async Task<IActionResult> GetCart(string userId, CancellationToken cancellationToken)
      => Success(await mediator.Send(new GetCartQuery(userId), cancellationToken));

    /// <summary>Add item to cart</summary>
    [HttpPost]
    public async Task<IActionResult> AddItem([FromBody] AddCartItemRequest request, CancellationToken cancellationToken)
    {
        return Success(await mediator.Send(new AddCartItemCommand(request), cancellationToken));
    }

    /// <summary>Remove item from cart</summary>
    [HttpDelete("{userId}/items/{bookId}")]
    public async Task<IActionResult> RemoveItem(string userId, string bookId, CancellationToken cancellationToken)
    {
        var request = new RemoveCartItemRequest { UserId = userId, BookId = bookId };

        return Success(await mediator.Send(new RemoveCartItemCommand(request), cancellationToken));
    }
}
