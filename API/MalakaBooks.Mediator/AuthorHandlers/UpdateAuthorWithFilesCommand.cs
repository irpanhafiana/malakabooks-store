using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.AuthorHandlers;

public record UpdateAuthorWithFilesCommand(string Id, UpdateAuthorWithFilesRequest Request) : IRequest<bool>;
