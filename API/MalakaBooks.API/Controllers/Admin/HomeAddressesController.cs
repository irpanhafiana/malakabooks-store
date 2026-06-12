using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.AddressHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Admin
{
    /// <summary>
    /// Exposes endpoints to create, retrieve, update, and delete home addresses.
    /// </summary>
    /// <remarks>Routes requests to api/v{version:apiVersion}/admin/homeaddresses and requires the
    /// MalakaAdminPolicy authorization. Uses MediatR to dispatch commands and queries and returns IActionResult
    /// responses.</remarks>
    [Route("api/v{version:apiVersion}/admin/[controller]")]
    [Authorize(Policy = "MalakaAdminPolicy")]
    public class HomeAddressesController : ApiControllerBase
    {
        private readonly IMediator mediator;

        /// <summary>
        /// Initializes a new instance of the HomeAddressesController class.
        /// </summary>
        /// <param name="mediator">The mediator used to send requests and publish notifications.</param>
        public HomeAddressesController(IMediator mediator)
        {
            this.mediator = mediator;
        }

        /// <summary>
        /// Gets all home addresses.
        /// </summary>
        /// <param name="cancellationToken">Cancellation token to cancel the operation.</param>
        /// <returns>A task that produces an IActionResult containing the collection of home addresses.</returns>
        [HttpGet]
        public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
            Success(await mediator.Send(new GetHomeAddressesQuery(), cancellationToken));

        /// <summary>
        /// Creates a home address by sending a CreateHomeAddressCommand via the mediator and returns an IActionResult
        /// representing the outcome.
        /// </summary>
        /// <remarks>Handles HTTP POST requests and delegates creation to the mediator.</remarks>
        /// <param name="request">The request that contains the home address details.</param>
        /// <param name="cancellationToken">A cancellation token to observe while performing the operation.</param>
        /// <returns>An IActionResult that represents the result of the create operation.</returns>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateHomeAddressRequest request, CancellationToken cancellationToken)
        {
            var result = await mediator.Send(new CreateHomeAddressCommand(request), cancellationToken);
            return ProcessResult(result);
        }

        /// <summary>
        /// Updates the home address for the resource identified by the specified id.
        /// </summary>
        /// <remarks>Sends an UpdateHomeAddressCommand via the mediator and returns the command result
        /// wrapped in a successful action result.</remarks>
        /// <param name="id">The identifier of the resource to update.</param>
        /// <param name="request">The request containing the updated home address information.</param>
        /// <param name="cancellationToken">A cancellation token to observe while waiting for the operation to complete.</param>
        /// <returns>An IActionResult containing the result of the update operation.</returns>
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateHomeAddressRequest request, CancellationToken cancellationToken)
        {
            var result = await mediator.Send(new UpdateHomeAddressCommand(id, request), cancellationToken);
            return Success(result);
        }

        /// <summary>
        /// Deletes the home address with the specified identifier.
        /// </summary>
        /// <param name="id">Identifier of the home address to delete.</param>
        /// <param name="cancellationToken">Cancellation token to observe while performing the operation.</param>
        /// <returns>An IActionResult that represents the result of the delete operation.</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken) =>
            Success(await mediator.Send(new DeleteHomeAddressCommand(id), cancellationToken));
    }
}
