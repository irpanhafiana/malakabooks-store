using FluentValidation;
using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.OrderHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Customer;

[Route("api/v{version:apiVersion}/customer/[controller]")]
[Authorize(Policy = "CustomerPolicy")]
public class OrdersController(
    IMediator mediator,
    IValidator<CreateOrderRequest> createValidator) : ApiControllerBase
{
    /// <summary>Create a new order</summary>
    [HttpPost]
    public async Task<ActionResult<OrderResponse>> Create([FromBody] CreateOrderRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await createValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
            return ProcessResult(validationResult);

        var order = await mediator.Send(new CreateOrderCommand(request), cancellationToken);
        return CreatedAtAction(nameof(GetByUser), new { userId = order.UserId, version = HttpContext.GetRequestedApiVersion()?.ToString() ?? "1.0" }, order);
    }

    /// <summary>Get own orders</summary>
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<IReadOnlyCollection<OrderResponse>>> GetByUser(string userId, CancellationToken cancellationToken) =>
        Ok(await mediator.Send(new GetOrdersByUserQuery(userId), cancellationToken));

    /// <summary>Get own order detail</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<OrderResponse>> GetById(string id, CancellationToken cancellationToken)
    {
        var order = await mediator.Send(new GetOrderByIdQuery(id), cancellationToken);
        return order is null ? NotFound() : Ok(order);
    }
}
