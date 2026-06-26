using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;

namespace MalakaBooks.Mediator.AuthorHandlers;

public class UpdateAuthorHandler(IAuthorRepository authorRepository) : IRequestHandler<UpdateAuthorCommand, bool>
{
    public async Task<bool> Handle(UpdateAuthorCommand request, CancellationToken cancellationToken)
    {
        var entity = await authorRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null) return false;

        entity.UpdateFrom(request.Request);
        return await authorRepository.UpdateAsync(request.Id, entity, cancellationToken);
    }
}
