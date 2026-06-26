using MediatR;

namespace MalakaBooks.Mediator.AuthorHandlers;

public record DeleteAuthorCommand(string Id) : IRequest<bool>;
