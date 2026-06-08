using FluentValidation;
using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.OrderHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers;

public class OrdersController(
    IMediator mediator,
    IValidator<CreateOrderRequest> createValidator,
    IValidator<UpdateOrderStatusRequest> updateStatusValidator) : ApiControllerBase
{
    [HttpPost]
    public async Task<ActionResult<OrderResponse>> Create([FromBody] CreateOrderRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await createValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return ProcessResult(validationResult);
        }

        var order = await mediator.Send(new CreateOrderCommand(request), cancellationToken);
        return CreatedAtAction(nameof(GetByUser), new { userId = order.UserId, version = HttpContext.GetRequestedApiVersion()?.ToString() ?? "1.0" }, order);
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<IReadOnlyCollection<OrderResponse>>> GetByUser(string userId, CancellationToken cancellationToken) =>
        Ok(await mediator.Send(new GetOrdersByUserQuery(userId), cancellationToken));

    [HttpPut("{id}/status")]
    public async Task<ActionResult<OrderResponse>> UpdateStatus(string id, [FromBody] UpdateOrderStatusRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await updateStatusValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return ProcessResult(validationResult);
        }

        var order = await mediator.Send(new UpdateOrderStatusCommand(id, request), cancellationToken);
        return order is null ? NotFound() : Ok(order);
    }
}
