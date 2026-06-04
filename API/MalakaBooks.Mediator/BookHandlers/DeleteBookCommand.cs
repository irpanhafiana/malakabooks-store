using MediatR;

namespace MalakaBooks.Mediator.BookHandlers;

public record DeleteBookCommand(string Id) : IRequest<bool>;
