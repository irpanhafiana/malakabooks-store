using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.UserHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Admin;

[Route("api/v{version:apiVersion}/admin/[controller]")]
[Authorize(Policy = "AdminPolicy")]
public class UsersController(IMediator mediator) : ApiControllerBase
{
    /// <summary>Get all users</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<UserResponse>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await mediator.Send(new GetAllUsersQuery(), cancellationToken));
}
