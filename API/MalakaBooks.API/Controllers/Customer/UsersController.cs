using FluentValidation;
using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.UserHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Customer;

[Route("api/v{version:apiVersion}/customer/[controller]")]
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
    public async Task<ActionResult<UserResponse>> CreateProfile([FromBody] CreateUserProfileRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await createValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
            return ProcessResult(validationResult);

        var user = await mediator.Send(new CreateUserProfileCommand(request), cancellationToken);
        return CreatedAtAction(nameof(GetProfile), new { id = user.Id, version = HttpContext.GetRequestedApiVersion()?.ToString() ?? "1.0" }, user);
    }

    /// <summary>Get own profile</summary>
    [HttpGet("{id}/profile")]
    [Authorize(Policy = "CustomerPolicy")]
    public async Task<ActionResult<UserResponse>> GetProfile(string id, CancellationToken cancellationToken)
    {
        var user = await mediator.Send(new GetUserProfileQuery(id), cancellationToken);
        return user is null ? NotFound() : Ok(user);
    }

    /// <summary>Update own profile (name, phone, avatar only)</summary>
    [HttpPut("{id}/profile")]
    [Authorize(Policy = "CustomerPolicy")]
    public async Task<ActionResult<UserResponse>> UpdateProfile(string id, [FromBody] UpdateUserRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await updateValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
            return ProcessResult(validationResult);

        var user = await mediator.Send(new UpdateUserProfileCommand(id, request), cancellationToken);
        return user is null ? NotFound() : Ok(user);
    }
}
