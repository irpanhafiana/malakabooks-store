using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.BookHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Public;

[Route("api/v{version:apiVersion}/public/[controller]")]
public class BooksController(IMediator mediator) : ApiControllerBase
{
    /// <summary>Get all books (public catalog)</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<BookResponse>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await mediator.Send(new GetBooksQuery(), cancellationToken));

    /// <summary>Get book by id (public)</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<BookResponse>> GetById(string id, CancellationToken cancellationToken)
    {
        var book = await mediator.Send(new GetBookByIdQuery(id), cancellationToken);
        return book is null ? NotFound() : Ok(book);
    }
}
