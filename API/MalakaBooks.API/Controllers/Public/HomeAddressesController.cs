using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.AddressHandlers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Public
{
    /// <summary>
    /// Exposes public API endpoints to retrieve home addresses.
    /// </summary>
    /// <remarks>Routes requests under api/v{version}/public/homeaddresses, allows anonymous access, and
    /// delegates request handling to an IMediator (MediatR).</remarks>
    [Route("api/v{version:apiVersion}/public/[controller]")]
    [AllowAnonymous]
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
        [AllowAnonymous]
        public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
            Success(await mediator.Send(new GetHomeAddressesQuery(), cancellationToken));

    }
}
