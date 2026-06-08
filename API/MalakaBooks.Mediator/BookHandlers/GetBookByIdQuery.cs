using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.BookHandlers;

public record GetBookByIdQuery(string Id) : IRequest<BookResponse?>;
