using FluentValidation;
using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.OrderHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Admin;

/// <summary>
/// Provides API endpoints for managing and administering orders in the system.
/// </summary>
/// <remarks>This controller is intended for administrative use and exposes endpoints for retrieving and updating
/// orders. Access to these endpoints may be restricted by authorization policies in production environments.</remarks>
/// <param name="mediator">The mediator used to send commands and queries related to order operations.</param>
/// <param name="updateStatusValidator">The validator used to ensure that order status update requests meet required validation rules.</param>
[Route("api/v{version:apiVersion}/admin/[controller]")]
[Authorize(Policy = "MalakaAdminPolicy")]
public class OrdersController(
    IMediator mediator,
    IValidator<UpdateOrderStatusRequest> updateStatusValidator) : ApiControllerBase
{
  /// <summary>Get all orders</summary>
  [HttpGet]
  public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
      Success(await mediator.Send(new GetAllOrdersQuery(), cancellationToken));

  /// <summary>Update order status</summary>
  [HttpPut("{id}/status")]
  public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateOrderStatusRequest request, CancellationToken cancellationToken)
  {
    var validationResult = await updateStatusValidator.ValidateAsync(request, cancellationToken);
    if (!validationResult.IsValid)
      return ProcessResult(validationResult);

    var order = await mediator.Send(new UpdateOrderStatusCommand(id, request), cancellationToken);
    return order is null ? NotFound() : Success(order);
  }
}
