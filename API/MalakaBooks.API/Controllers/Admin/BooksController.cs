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
[Route("api/v{version:apiVersion}/admin/[controller]")]
[Authorize(Policy = "MalakaAdminPolicy")]
public class BooksController(IMediator mediator) : ApiControllerBase
{
    /// <summary>
    /// Gets all books.
    /// </summary>
    /// <remarks>Sends a GetBooksQuery through the mediator and returns the result wrapped in a successful
    /// response.</remarks>
    /// <param name="cancellationToken">Cancellation token to cancel the request.</param>
    /// <returns>An IActionResult containing the retrieved books on success.</returns>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Success(await mediator.Send(new GetBooksQuery(), cancellationToken));

    /// <summary>
    /// Retrieves a book by its identifier.
    /// </summary>
    /// <param name="id">The identifier of the book to retrieve.</param>
    /// <param name="cancellationToken">A cancellation token to observe while the request is processed.</param>
    /// <returns>An IActionResult containing the book if found (200 OK), or NotFound (404) if not.</returns>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
    {
        var book = await mediator.Send(new GetBookByIdQuery(id), cancellationToken);
        return book is null ? NotFound() : Success(book);
    }

    /// <summary>
    /// Creates a book by sending a CreateBookCommand to the mediator and returns an HTTP result representing the operation
    /// outcome.
    /// </summary>
    /// <param name="request">The request containing the details for the book to create.</param>
    /// <param name="cancellationToken">Cancellation token to cancel the operation.</param>
    /// <returns>An IActionResult representing the HTTP response for the create operation, reflecting success or failure statuses.</returns>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBookRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CreateBookCommand(request), cancellationToken);
        return ProcessResult(result);
    }

    /// <summary>
    /// Updates an existing book identified by the specified id using the provided request payload.
    /// </summary>
    /// <param name="id">Identifier of the book to update.</param>
    /// <param name="request">UpdateBookRequest containing the new values for the book.</param>
    /// <param name="cancellationToken">CancellationToken to cancel the operation.</param>
    /// <returns>An IActionResult containing the result of the update operation, typically a success response with the updated
    /// resource or an error status code.</returns>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateBookRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new UpdateBookCommand(id, request), cancellationToken);
        return Success(result);
    }

    /// <summary>
    /// Deletes the book with the specified identifier.
    /// </summary>
    /// <param name="id">The identifier of the book to delete.</param>
    /// <param name="cancellationToken">A token to observe while waiting for the task to complete.</param>
    /// <returns>An IActionResult representing the outcome of the delete operation.</returns>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
      => Success(await mediator.Send(new DeleteBookCommand(id), cancellationToken));
}
