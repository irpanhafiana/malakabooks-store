using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.AuthorHandlers;

public record CreateAuthorCommand(CreateAuthorRequest Request) : IRequest<bool>;
