using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.AuthorHandlers;

public record UpdateAuthorCommand(string Id, UpdateAuthorRequest Request) : IRequest<bool>;
