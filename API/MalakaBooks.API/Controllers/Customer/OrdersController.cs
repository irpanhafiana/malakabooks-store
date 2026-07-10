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
[Route("api/v{version:apiVersion}/customer/[controller]")]
[Authorize(Policy = "MalakaCustomerPolicy")]
public class OrdersController(IMediator mediator) : ApiControllerBase
{
    /// <summary>
    /// Creates a new order by sending a CreateOrderCommand to the mediator and returns an IActionResult representing
    /// success or validation failure.
    /// </summary>
    /// <remarks>If the mediator result is not successful, the action returns a validation error (defaults to
    /// "Validation failed" when no message is provided) using an error code of "ValidationError" and status 400;
    /// otherwise it returns a success result containing the mediator response.</remarks>
    /// <param name="request">Order creation request containing the details required to create the order.</param>
    /// <param name="cancellationToken">Cancellation token used to cancel the create operation.</param>
    /// <returns>An IActionResult that contains a success response when the order is created, or a failure response with
    /// validation errors and a 400 Bad Request status when creation fails.</returns>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CreateOrderCommand(request), cancellationToken);
        if (!result.IsSuccess)
        {
            return Fail(string.IsNullOrWhiteSpace(result.Message) ? "Validation failed" : result.Message, result.Errors, "ValidationError", StatusCodes.Status400BadRequest);
        }

        return Success(result);
    }


    /// <summary>
    /// Retrieves the orders for the specified user.
    /// </summary>
    /// <remarks>Route: GET /user/{userId}. Delegates to the mediator to execute the GetOrdersByUserQuery
    /// asynchronously.</remarks>
    /// <param name="userId">The identifier of the user whose orders are retrieved.</param>
    /// <param name="cancellationToken">Token to observe for request cancellation.</param>
    /// <returns>An IActionResult containing the query result; on success returns 200 OK with the user's orders.</returns>
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUser(string userId, CancellationToken cancellationToken) =>
        Success(await mediator.Send(new GetOrdersByUserQuery(userId), cancellationToken));


    /// <summary>
    /// Gets an order by identifier.
    /// </summary>
    /// <remarks>Dispatches a GetOrderByIdQuery through the mediator.</remarks>
    /// <param name="id">The order identifier.</param>
    /// <param name="cancellationToken">Token to observe while awaiting the operation.</param>
    /// <returns>An IActionResult containing the order when found (200 OK) or an appropriate error result.</returns>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
    {
        var order = await mediator.Send(new GetOrderByIdQuery(id), cancellationToken);
        return Success(order);
    }
}
