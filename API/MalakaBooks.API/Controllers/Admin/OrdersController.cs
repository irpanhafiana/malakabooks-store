using FluentValidation;
using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.OrderHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Admin;

[Route("api/v{version:apiVersion}/admin/[controller]")]
[Authorize(Policy = "AdminPolicy")]
public class OrdersController(
    IMediator mediator,
    IValidator<UpdateOrderStatusRequest> updateStatusValidator) : ApiControllerBase
{
    /// <summary>Get all orders</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<OrderResponse>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await mediator.Send(new GetAllOrdersQuery(), cancellationToken));

    /// <summary>Update order status</summary>
    [HttpPut("{id}/status")]
    public async Task<ActionResult<OrderResponse>> UpdateStatus(string id, [FromBody] UpdateOrderStatusRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await updateStatusValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
            return ProcessResult(validationResult);

        var order = await mediator.Send(new UpdateOrderStatusCommand(id, request), cancellationToken);
        return order is null ? NotFound() : Ok(order);
    }
}
