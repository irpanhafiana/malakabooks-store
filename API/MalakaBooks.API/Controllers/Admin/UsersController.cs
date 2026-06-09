using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.UserHandlers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Admin;

/// <summary>
/// Represents an API controller that provides administrative endpoints for managing users.
/// </summary>
/// <param name="mediator">The mediator used to send requests and commands within the application.</param>
[Route("api/v{version:apiVersion}/admin/[controller]")]
[Authorize(Policy = "MalakaAdminPolicy")]
public class UsersController(IMediator mediator) : ApiControllerBase
{
  /// <summary>Get all users</summary>
  [HttpGet]
  public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
      Success(await mediator.Send(new GetAllUsersQuery(), cancellationToken));
}
