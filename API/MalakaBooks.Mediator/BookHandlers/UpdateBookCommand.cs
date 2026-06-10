using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.BookHandlers;

public record UpdateBookCommand(string Id, UpdateBookRequest Request) : IRequest<bool>;
