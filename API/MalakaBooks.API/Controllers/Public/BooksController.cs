using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.BookHandlers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Public;
/// <summary>
/// Represents an API controller that provides public endpoints for retrieving book information from the catalog.
/// </summary>
/// <remarks>This controller exposes read-only endpoints for accessing the public book catalog. All routes are
/// versioned and accessible without authentication. Use this controller to retrieve lists of books or details for a
/// specific book by its identifier.</remarks>
/// <param name="mediator">The mediator used to send queries for retrieving book data.</param>
[Route("api/v{version:apiVersion}/public/[controller]")]
[AllowAnonymous]
public class BooksController(IMediator mediator) : ApiControllerBase
{
  /// <summary>Get all books (public catalog)</summary>
  [HttpGet]
  public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
      Success(await mediator.Send(new GetBooksQuery(), cancellationToken));

  /// <summary>Get book by id (public)</summary>
  [HttpGet("{id}")]
  public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
  {
    var book = await mediator.Send(new GetBookByIdQuery(id), cancellationToken);
    return book is null ? NotFound() : Success(book);
  }
}
