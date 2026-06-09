using FluentValidation;
using MalakaBooks.API.Controllers.Base;
using MalakaBooks.Mediator.BookHandlers;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MalakaBooks.API.Controllers.Admin;
/// <summary>
/// Provides API endpoints for managing books, including operations to retrieve, create, update, and delete book
/// records.
/// </summary>
/// <remarks>All endpoints require administrative access. The controller is versioned as part of the API route and
/// is intended for use by administrative clients managing the book catalog.</remarks>
/// <param name="mediator">The mediator used to send commands and queries related to book operations.</param>
/// <param name="createValidator">The validator used to validate requests for creating new books.</param>
/// <param name="updateValidator">The validator used to validate requests for updating existing books.</param>
[Route("api/v{version:apiVersion}/admin/[controller]")]
[Authorize(Policy = "MalakaAdminPolicy")]
public class BooksController(
    IMediator mediator,
    IValidator<CreateBookRequest> createValidator,
    IValidator<UpdateBookRequest> updateValidator) : ApiControllerBase
{
  /// <summary>Get all books</summary>
  [HttpGet]
  public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
      Success(await mediator.Send(new GetBooksQuery(), cancellationToken));

  /// <summary>Get book by id</summary>
  [HttpGet("{id}")]
  public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
  {
    var book = await mediator.Send(new GetBookByIdQuery(id), cancellationToken);
    return book is null ? NotFound() : Success(book);
  }

  /// <summary>Create book</summary>
  [HttpPost]
  public async Task<IActionResult> Create([FromBody] CreateBookRequest request, CancellationToken cancellationToken)
  {
    var validationResult = await createValidator.ValidateAsync(request, cancellationToken);
    if (!validationResult.IsValid)
      return ProcessResult(validationResult);

    var book = await mediator.Send(new CreateBookCommand(request), cancellationToken);
    return CreatedAtAction(nameof(GetById), new { id = book.Id, version = HttpContext.GetRequestedApiVersion()?.ToString() ?? "1.0" }, book);
  }

  /// <summary>Update book</summary>
  [HttpPut("{id}")]
  public async Task<IActionResult> Update(string id, [FromBody] UpdateBookRequest request, CancellationToken cancellationToken)
  {
    var validationResult = await updateValidator.ValidateAsync(request, cancellationToken);
    if (!validationResult.IsValid)
      return ProcessResult(validationResult);

    var book = await mediator.Send(new UpdateBookCommand(id, request), cancellationToken);
    return book is null ? NotFound() : Success(book);
  }

  /// <summary>Delete book</summary>
  [HttpDelete("{id}")]
  public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken) =>
      await mediator.Send(new DeleteBookCommand(id), cancellationToken) ? NoContent() : NotFound();
}
