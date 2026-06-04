using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.CategoryHandlers;

public class UpdateCategoryHandler(ICategoryRepository categoryRepository) : IRequestHandler<UpdateCategoryCommand, CategoryResponse?>
{
    public async Task<CategoryResponse?> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var entity = await categoryRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null)
        {
            return null;
        }

        entity.UpdateFrom(request.Request);
        await categoryRepository.UpdateAsync(request.Id, entity, cancellationToken);
        return entity.ToResponse();
    }
}
