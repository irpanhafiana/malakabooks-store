using FluentValidation;
using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.AddressHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Customer;

/// <summary>
/// API controller that manages address resources for customers, providing endpoints to create, retrieve, update, and
/// delete addresses associated with a user.
/// </summary>
/// <remarks>All endpoints require the user to be authenticated and are versioned via the API route. The
/// controller is intended for use by customer-facing clients to manage their own address data.</remarks>
/// <param name="mediator">The mediator used to send commands and queries related to address operations.</param>
/// <param name="createValidator">The validator used to validate requests for creating new addresses.</param>
/// <param name="updateValidator">The validator used to validate requests for updating existing addresses.</param>
[Route("api/v{version:apiVersion}/customer/[controller]")]
[Authorize(Policy = "MalakaCustomerPolicy")]
public class AddressesController(
    IMediator mediator,
    IValidator<CreateAddressRequest> createValidator,
    IValidator<UpdateAddressRequest> updateValidator) : ApiControllerBase
{
  /// <summary>Get own addresses</summary>
  [HttpGet("user/{userId}")]
  public async Task<IActionResult> GetByUser(string userId, CancellationToken cancellationToken) =>
      Success(await mediator.Send(new GetAddressesByUserQuery(userId), cancellationToken));

  /// <summary>Create address</summary>
  [HttpPost]
  public async Task<IActionResult> Create([FromBody] CreateAddressRequest request, CancellationToken cancellationToken)
  {
    var validationResult = await createValidator.ValidateAsync(request, cancellationToken);
    if (!validationResult.IsValid)
      return ProcessResult(validationResult);

    var address = await mediator.Send(new CreateAddressCommand(request), cancellationToken);
    return CreatedAtAction(nameof(GetByUser), new { userId = address.UserId, version = HttpContext.GetRequestedApiVersion()?.ToString() ?? "1.0" }, address);
  }

  /// <summary>Update address</summary>
  [HttpPut("{id}")]
  public async Task<IActionResult> Update(string id, [FromBody] UpdateAddressRequest request, CancellationToken cancellationToken)
  {
    var validationResult = await updateValidator.ValidateAsync(request, cancellationToken);
    if (!validationResult.IsValid)
      return ProcessResult(validationResult);

    var address = await mediator.Send(new UpdateAddressCommand(id, request), cancellationToken);
    return address is null ? NotFound() : Success(address);
  }

  /// <summary>Delete address</summary>
  [HttpDelete("{id}")]
  public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken) =>
      await mediator.Send(new DeleteAddressCommand(id), cancellationToken) ? NoContent() : NotFound();
}
