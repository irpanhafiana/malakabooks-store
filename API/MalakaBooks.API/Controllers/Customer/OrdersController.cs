using FluentValidation;
using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.OrderHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Customer;
/// <summary>
/// Represents an API controller for managing customer orders, including creating new orders and retrieving order
/// details for the authenticated user.
/// </summary>
/// <remarks>This controller is versioned and routes are prefixed with the API version and customer context.
/// Endpoints require the user to be authenticated as a customer. All actions operate on behalf of the authenticated
/// user and are intended for use in customer-facing scenarios.</remarks>
/// <param name="mediator">The mediator used to send commands and queries related to order operations.</param>
/// <param name="createValidator">The validator used to validate incoming create order requests.</param>
[Route("api/v{version:apiVersion}/customer/[controller]")]
[Authorize(Policy = "MalakaCustomerPolicy")]
public class OrdersController(
    IMediator mediator,
    IValidator<CreateOrderRequest> createValidator) : ApiControllerBase
{
  /// <summary>Create a new order</summary>
  [HttpPost]
  public async Task<IActionResult> Create([FromBody] CreateOrderRequest request, CancellationToken cancellationToken)
  {
    var validationResult = await createValidator.ValidateAsync(request, cancellationToken);
    if (!validationResult.IsValid)
      return ProcessResult(validationResult);

    var order = await mediator.Send(new CreateOrderCommand(request), cancellationToken);
    return CreatedAtAction(nameof(GetByUser), new { userId = order.UserId, version = HttpContext.GetRequestedApiVersion()?.ToString() ?? "1.0" }, order);
  }

  /// <summary>Get own orders</summary>
  [HttpGet("user/{userId}")]
  public async Task<IActionResult> GetByUser(string userId, CancellationToken cancellationToken) =>
      Success(await mediator.Send(new GetOrdersByUserQuery(userId), cancellationToken));

  /// <summary>Get own order detail</summary>
  [HttpGet("{id}")]
  public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
  {
    var order = await mediator.Send(new GetOrderByIdQuery(id), cancellationToken);
    return order is null ? NotFound() : Success(order);
  }
}
