using MalakaBooks.IRepository;
using MediatR;

namespace MalakaBooks.Mediator.AuthorHandlers;

public class DeleteAuthorHandler(IAuthorRepository authorRepository) : IRequestHandler<DeleteAuthorCommand, bool>
{
    public async Task<bool> Handle(DeleteAuthorCommand request, CancellationToken cancellationToken) =>
        await authorRepository.DeleteAsync(request.Id, cancellationToken);
}
