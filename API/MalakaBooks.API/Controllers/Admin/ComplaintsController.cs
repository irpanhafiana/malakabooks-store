using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.ComplaintHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Admin;

/// <summary>
/// Provides API endpoints for administrators to view and respond to user complaints.
/// </summary>
/// <remarks>This controller is intended for administrative use and is versioned as part of the API route. Access
/// may be restricted by policy in production environments.</remarks>
/// <param name="mediator">The mediator used to send commands and queries related to complaints.</param>
[Route("api/v{version:apiVersion}/admin/[controller]")]
[Authorize(Policy = "MalakaAdminPolicy")]
public class ComplaintsController(IMediator mediator) : ApiControllerBase
{
  /// <summary>Get all complaints</summary>
  [HttpGet]
  public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
      Success(await mediator.Send(new GetAllComplaintsQuery(), cancellationToken));

  /// <summary>Respond to a complaint</summary>
  [HttpPut("{id}/respond")]
  public async Task<IActionResult> Respond(string id, [FromBody] RespondComplaintRequest request, CancellationToken cancellationToken)
  {
    var complaint = await mediator.Send(new RespondComplaintCommand(id, request), cancellationToken);
    return complaint is null ? NotFound() : Success(complaint);
  }
}
