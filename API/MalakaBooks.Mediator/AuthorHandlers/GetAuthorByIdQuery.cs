using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.AuthorHandlers;

public record GetAuthorByIdQuery(string Id) : IRequest<AuthorResponse?>;
