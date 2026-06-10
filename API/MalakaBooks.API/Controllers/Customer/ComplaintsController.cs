using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.ComplaintHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Customer;

/// <summary>
/// Handles customer complaint-related API requests, including retrieving and submitting complaints for the
/// authenticated user.
/// </summary>
/// <remarks>This controller is versioned and routes requests under the 'api/v{version}/customer/complaints' path.
/// Access may be restricted by customer authorization policies, depending on configuration.</remarks>
/// <param name="mediator">The mediator used to send commands and queries related to complaint operations.</param>
[Route("api/v{version:apiVersion}/customer/[controller]")]
[Authorize(Policy = "MalakaCustomerPolicy")]
public class ComplaintsController(IMediator mediator) : ApiControllerBase
{
  /// <summary>Get own complaints</summary>
  [HttpGet("user/{userId}")]
  public async Task<IActionResult> GetByUser(string userId, CancellationToken cancellationToken) =>
      Success(await mediator.Send(new GetComplaintsByUserQuery(userId), cancellationToken));

  /// <summary>Submit a complaint</summary>
  [HttpPost]
  public async Task<IActionResult> Create([FromBody] CreateComplaintRequest request, CancellationToken cancellationToken)
  {
    var result = await mediator.Send(new CreateComplaintCommand(request), cancellationToken);
    return ProcessResult(result);
  }
}
