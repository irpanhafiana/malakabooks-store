using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.AuthorHandlers;

public class GetAuthorByIdHandler(IAuthorRepository authorRepository) : IRequestHandler<GetAuthorByIdQuery, AuthorResponse?>
{
    public async Task<AuthorResponse?> Handle(GetAuthorByIdQuery request, CancellationToken cancellationToken) =>
        (await authorRepository.GetByIdAsync(request.Id, cancellationToken))?.ToResponse();
}
