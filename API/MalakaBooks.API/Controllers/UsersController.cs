using FluentValidation;
using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.UserHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers;

public class UsersController(
    IMediator mediator,
    IValidator<UpdateUserRequest> updateValidator) : ApiControllerBase
{
    [HttpGet("{id}/profile")]
    public async Task<ActionResult<UserResponse>> GetProfile(string id, CancellationToken cancellationToken)
    {
        var user = await mediator.Send(new GetUserProfileQuery(id), cancellationToken);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpPut("{id}/profile")]
    public async Task<ActionResult<UserResponse>> UpdateProfile(string id, [FromBody] UpdateUserRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await updateValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return ProcessResult(validationResult);
        }

        var user = await mediator.Send(new UpdateUserProfileCommand(id, request), cancellationToken);
        return user is null ? NotFound() : Ok(user);
    }
}
