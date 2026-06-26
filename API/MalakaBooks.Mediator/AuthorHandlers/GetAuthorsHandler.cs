using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.AuthorHandlers;

public class GetAuthorsHandler(IAuthorRepository authorRepository) : IRequestHandler<GetAuthorsQuery, IReadOnlyCollection<AuthorResponse>>
{
    public async Task<IReadOnlyCollection<AuthorResponse>> Handle(GetAuthorsQuery request, CancellationToken cancellationToken) =>
        (await authorRepository.GetAllAsync(cancellationToken)).Select(authorEntity => authorEntity.ToResponse()).ToArray();
}
