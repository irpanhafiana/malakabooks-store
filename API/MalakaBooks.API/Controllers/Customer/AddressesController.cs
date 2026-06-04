using FluentValidation;
using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.AddressHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Customer;

[Route("api/v{version:apiVersion}/customer/[controller]")]
[Authorize(Policy = "CustomerPolicy")]
public class AddressesController(
    IMediator mediator,
    IValidator<CreateAddressRequest> createValidator,
    IValidator<UpdateAddressRequest> updateValidator) : ApiControllerBase
{
    /// <summary>Get own addresses</summary>
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<IReadOnlyCollection<AddressResponse>>> GetByUser(string userId, CancellationToken cancellationToken) =>
        Ok(await mediator.Send(new GetAddressesByUserQuery(userId), cancellationToken));

    /// <summary>Create address</summary>
    [HttpPost]
    public async Task<ActionResult<AddressResponse>> Create([FromBody] CreateAddressRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await createValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
            return ProcessResult(validationResult);

        var address = await mediator.Send(new CreateAddressCommand(request), cancellationToken);
        return CreatedAtAction(nameof(GetByUser), new { userId = address.UserId, version = HttpContext.GetRequestedApiVersion()?.ToString() ?? "1.0" }, address);
    }

    /// <summary>Update address</summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<AddressResponse>> Update(string id, [FromBody] UpdateAddressRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await updateValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
            return ProcessResult(validationResult);

        var address = await mediator.Send(new UpdateAddressCommand(id, request), cancellationToken);
        return address is null ? NotFound() : Ok(address);
    }

    /// <summary>Delete address</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken) =>
        await mediator.Send(new DeleteAddressCommand(id), cancellationToken) ? NoContent() : NotFound();
}
