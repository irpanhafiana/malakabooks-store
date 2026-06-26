using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;

namespace MalakaBooks.Mediator.AuthorHandlers;

public class CreateAuthorHandler(IAuthorRepository authorRepository) : IRequestHandler<CreateAuthorCommand, bool>
{
    public async Task<bool> Handle(CreateAuthorCommand request, CancellationToken cancellationToken)
    {
        await authorRepository.CreateAsync(request.Request.ToEntity(), cancellationToken);
        return true;
    }
}
