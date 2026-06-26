using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.AuthorHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

#pragma warning disable CS1591

namespace MalakaBooks.API.Controllers.Admin;

/// <summary>
/// Represents an API controller that manages author resources for administrative operations.
/// </summary>
/// <remarks>This controller provides endpoints for creating, retrieving, updating, and deleting authors.</remarks>
/// <param name="mediator">The mediator used to send commands and queries related to author operations.</param>
[Route("api/v{version:apiVersion}/admin/[controller]")]
[Authorize(Policy = "MalakaAdminPolicy")]
public class AuthorsController(IMediator mediator) : ApiControllerBase
{
    /// <summary>Get all authors</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Success(await mediator.Send(new GetAuthorsQuery(), cancellationToken));

    /// <summary>Get author by id</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
    {
        var author = await mediator.Send(new GetAuthorByIdQuery(id), cancellationToken);
        return author is null ? NotFound() : Success(author);
    }

    /// <summary>Create author</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAuthorRequest request, CancellationToken cancellationToken) =>
        Success(await mediator.Send(new CreateAuthorCommand(request), cancellationToken));

    /// <summary>Update author</summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateAuthorRequest request, CancellationToken cancellationToken) =>
        Success(await mediator.Send(new UpdateAuthorCommand(id, request), cancellationToken));

    /// <summary>Delete author</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken) =>
        Success(await mediator.Send(new DeleteAuthorCommand(id), cancellationToken));
}

#pragma warning restore CS1591
