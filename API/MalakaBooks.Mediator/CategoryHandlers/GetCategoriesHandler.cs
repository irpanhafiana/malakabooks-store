using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.CategoryHandlers;

public class GetCategoriesHandler(ICategoryRepository categoryRepository, IItemRepository itemRepository) : IRequestHandler<GetCategoriesQuery, IReadOnlyCollection<CategoryResponse>>
{
    public async Task<IReadOnlyCollection<CategoryResponse>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ItemType))
        {
            return (await categoryRepository.GetAllAsync(cancellationToken))
                .Select(categoryEntity => categoryEntity.ToResponse())
                .ToArray();
        }

        var categoryIds = (await itemRepository.GetByItemTypeAsync(request.ItemType, cancellationToken))
            .Select(item => item.CategoryId)
            .Where(categoryId => !string.IsNullOrWhiteSpace(categoryId))
            .Select(categoryId => categoryId!)
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        return (await categoryRepository.GetByIdsAsync(categoryIds, cancellationToken))
            .Select(categoryEntity => categoryEntity.ToResponse())
            .ToArray();
    }
}
