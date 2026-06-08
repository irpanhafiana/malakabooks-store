using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.BookHandlers;

public record CreateBookCommand(CreateBookRequest Request) : IRequest<BookResponse>;
