using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.AuthorHandlers;

public record CreateAuthorWithFilesCommand(CreateAuthorWithFilesRequest Request) : IRequest<bool>;
