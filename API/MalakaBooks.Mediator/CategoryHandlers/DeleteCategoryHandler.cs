using MalakaBooks.IRepository;
using MediatR;

namespace MalakaBooks.Mediator.CategoryHandlers;

public class DeleteCategoryHandler(ICategoryRepository categoryRepository) : IRequestHandler<DeleteCategoryCommand, bool>
{
    public async Task<bool> Handle(DeleteCategoryCommand request, CancellationToken cancellationToken) =>
        await categoryRepository.DeleteAsync(request.Id, cancellationToken);
}
