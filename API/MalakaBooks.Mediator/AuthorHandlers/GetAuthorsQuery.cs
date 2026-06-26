using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.AuthorHandlers;

public record GetAuthorsQuery() : IRequest<IReadOnlyCollection<AuthorResponse>>;
