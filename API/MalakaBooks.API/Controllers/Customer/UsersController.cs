using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.UserHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Customer;
/// <summary>
/// Handles user profile operations for customers, including creation, retrieval, and update of user profiles after
/// identity registration.
/// </summary>
/// <remarks>This controller is intended to be used by customer-facing clients immediately after identity
/// registration. Profile creation does not require authentication and is designed to be called after receiving the
/// subject claim from the identity provider. Only profile data (such as name, phone, and avatar) is managed here;
/// authentication and sensitive information like email and password are handled by the identity server.</remarks>
/// <param name="mediator">The mediator used to send commands and queries related to user profile operations.</param>
[Route("api/v{version:apiVersion}/customer/[controller]")]
[Authorize(Policy = "MalakaCustomerPolicy")]
public class UsersController(IMediator mediator) : ApiControllerBase
{

    /// <summary>
    /// Creates a new IdentityServer4 user profile using the specified request data.
    /// </summary>
    /// <param name="request">The details of the user profile to create. Cannot be null.</param>
    /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
    /// <returns>An <see cref="IActionResult"/> indicating the result of the profile creation operation. Returns a success response
    /// if the profile is created; otherwise, returns an error response describing the failure.</returns>
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> CreateIS4Profile([FromBody] CreateIS4UserRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new RegisterUserCommand(request), cancellationToken);

        return ProcessResult(result);
    }

    ///// <summary>
    ///// Create user profile in MongoDB after IS4 registration.
    ///// No auth required — called immediately after IS4 returns the sub claim.
    ///// Stores: Id (IS4 sub), Name, Phone, Avatar, CreatedAt only.
    ///// Role/Email/Password are managed by IS4.
    ///// </summary>
    //[HttpPost]
    //[AllowAnonymous]
    //public async Task<IActionResult> CreateProfile([FromBody] CreateUserProfileRequest request, CancellationToken cancellationToken)
    //{
    //  var result = await mediator.Send(new CreateUserProfileCommand(request), cancellationToken);

    //  return ProcessResult(result);
    //}

    /// <summary>Get own profile</summary>
    [HttpGet("{name}/profile")]
    //[Authorize(Policy = "CustomerPolicy")]
    public async Task<IActionResult> GetProfile(string name, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetUserProfileQuery(name), cancellationToken);
        return Success(result);
    }

    /// <summary>Update own profile (name, phone, avatar only)</summary>
    [HttpPut("{id}/profile")]
    //[Authorize(Policy = "CustomerPolicy")]
    public async Task<IActionResult> UpdateProfile(string id, [FromBody] UpdateUserRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new UpdateUserProfileCommand(id, request), cancellationToken);
        return Success(result);
    }
}
