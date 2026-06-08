using FluentValidation;
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
/// <param name="createValidator">The validator used to validate requests for creating user profiles.</param>
/// <param name="updateValidator">The validator used to validate requests for updating user profiles.</param>
[Route("api/v{version:apiVersion}/customer/[controller]")]
[Authorize(Policy = "MalakaCustomerPolicy")]
public class UsersController(
    IMediator mediator,
    IValidator<CreateUserProfileRequest> createValidator,
    IValidator<UpdateUserRequest> updateValidator) : ApiControllerBase
{
  /// <summary>
  /// Create user profile in MongoDB after IS4 registration.
  /// No auth required — called immediately after IS4 returns the sub claim.
  /// Stores: Id (IS4 sub), Name, Phone, Avatar, CreatedAt only.
  /// Role/Email/Password are managed by IS4.
  /// </summary>
  [HttpPost]
  [AllowAnonymous]
  public async Task<IActionResult> CreateProfile([FromBody] CreateUserProfileRequest request, CancellationToken cancellationToken)
  {
    var validationResult = await createValidator.ValidateAsync(request, cancellationToken);
    if (!validationResult.IsValid)
      return ProcessResult(validationResult);

    var user = await mediator.Send(new CreateUserProfileCommand(request), cancellationToken);
    return CreatedAtAction(nameof(GetProfile), new { id = user.Id, version = HttpContext.GetRequestedApiVersion()?.ToString() ?? "1.0" }, user);
  }

  /// <summary>Get own profile</summary>
  [HttpGet("{id}/profile")]
  //[Authorize(Policy = "CustomerPolicy")]
  public async Task<IActionResult> GetProfile(string id, CancellationToken cancellationToken)
  {
    var user = await mediator.Send(new GetUserProfileQuery(id), cancellationToken);
    return user is null ? NotFound() : Success(user);
  }

  /// <summary>Update own profile (name, phone, avatar only)</summary>
  [HttpPut("{id}/profile")]
  //[Authorize(Policy = "CustomerPolicy")]
  public async Task<IActionResult> UpdateProfile(string id, [FromBody] UpdateUserRequest request, CancellationToken cancellationToken)
  {
    var validationResult = await updateValidator.ValidateAsync(request, cancellationToken);
    if (!validationResult.IsValid)
      return ProcessResult(validationResult);

    var user = await mediator.Send(new UpdateUserProfileCommand(id, request), cancellationToken);
    return user is null ? NotFound() : Success(user);
  }
}
