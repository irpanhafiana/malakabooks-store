using FluentValidation;
using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.BookHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Admin;

[Route("api/v{version:apiVersion}/admin/[controller]")]
[Authorize(Policy = "AdminPolicy")]
public class BooksController(
    IMediator mediator,
    IValidator<CreateBookRequest> createValidator,
    IValidator<UpdateBookRequest> updateValidator) : ApiControllerBase
{
    /// <summary>Get all books</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<BookResponse>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await mediator.Send(new GetBooksQuery(), cancellationToken));

    /// <summary>Get book by id</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<BookResponse>> GetById(string id, CancellationToken cancellationToken)
    {
        var book = await mediator.Send(new GetBookByIdQuery(id), cancellationToken);
        return book is null ? NotFound() : Ok(book);
    }

    /// <summary>Create book</summary>
    [HttpPost]
    public async Task<ActionResult<BookResponse>> Create([FromBody] CreateBookRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await createValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
            return ProcessResult(validationResult);

        var book = await mediator.Send(new CreateBookCommand(request), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = book.Id, version = HttpContext.GetRequestedApiVersion()?.ToString() ?? "1.0" }, book);
    }

    /// <summary>Update book</summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<BookResponse>> Update(string id, [FromBody] UpdateBookRequest request, CancellationToken cancellationToken)
    {
        var validationResult = await updateValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
            return ProcessResult(validationResult);

        var book = await mediator.Send(new UpdateBookCommand(id, request), cancellationToken);
        return book is null ? NotFound() : Ok(book);
    }

    /// <summary>Delete book</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken) =>
        await mediator.Send(new DeleteBookCommand(id), cancellationToken) ? NoContent() : NotFound();
}
