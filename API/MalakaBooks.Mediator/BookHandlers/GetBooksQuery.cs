using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.BookHandlers;

public record GetBooksQuery() : IRequest<IReadOnlyCollection<BookResponse>>;
