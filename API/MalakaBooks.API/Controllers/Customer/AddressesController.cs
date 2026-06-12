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
/// <remarks>
/// Initializes a new instance of the AddressesController class with the specified mediator, Simasrim API client, and
/// Simasrim settings.
/// </remarks>
[Route("api/v{version:apiVersion}/customer/[controller]")]
[Authorize(Policy = "MalakaCustomerPolicy")]

public class AddressesController : ApiControllerBase
{
    private readonly IMediator mediator;

    /// <summary>
    /// Initializes a new instance of the AddressesController class with the specified mediator, Simasrim API client, and
    /// Simasrim settings.
    /// </summary>
    /// <param name="mediator">The mediator used to send commands and queries within the application.</param>
    public AddressesController(IMediator mediator)
    {
        this.mediator = mediator;
    }

    /// <summary>Get own addresses</summary>
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUser(string userId, CancellationToken cancellationToken) =>
        Success(await mediator.Send(new GetAddressesByUserQuery(userId), cancellationToken));

    /// <summary>Create address</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAddressRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CreateAddressCommand(request), cancellationToken);
        return ProcessResult(result);
    }

    /// <summary>Update address</summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateAddressRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new UpdateAddressCommand(id, request), cancellationToken);
        return Success(result);
    }

    /// <summary>Delete address</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
      => Success(await mediator.Send(new DeleteAddressCommand(id), cancellationToken));

}
