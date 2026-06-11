using MalakaBooks.API.Controllers.Base;
using MalakaBooks.General;
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
[Route("api/v{version:apiVersion}/admin/[controller]")]
[Authorize(Policy = "MalakaAdminPolicy")]
public class OrdersController(IMediator mediator) : ApiControllerBase
{
  /// <summary>
  /// Retrieves a paginated list of orders based on the specified paging parameters.
  /// </summary>
  /// <param name="data">The paging parameters that specify the page number and page size for the results. Cannot be null.</param>
  /// <param name="cancellationToken">A cancellation token that can be used to cancel the operation.</param>
  /// <returns>An <see cref="IActionResult"/> containing the paginated list of orders.</returns>
  [HttpPost]
  public async Task<IActionResult> GetAll(PagingParam data, CancellationToken cancellationToken)
  {
    return Success(await mediator.Send(new GetAllOrdersQuery(data.PageNumber, data.PageSize), cancellationToken));
  }

  /// <summary>
  /// Updates the status of the specified order.
  /// </summary>
  /// <param name="id">The unique identifier of the order to update.</param>
  /// <param name="request">An object containing the new status and any additional information required to update the order status. Cannot be
  /// null.</param>
  /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
  /// <returns>An <see cref="IActionResult"/> that represents the result of the update operation. Returns a success response with
  /// the updated order status if the operation completes successfully.</returns>
  [HttpPut("{id}/status")]
  public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateOrderStatusRequest request, CancellationToken cancellationToken)
  {
    var result = await mediator.Send(new UpdateOrderStatusCommand(id, request), cancellationToken);
    return Success(result);
  }
}
