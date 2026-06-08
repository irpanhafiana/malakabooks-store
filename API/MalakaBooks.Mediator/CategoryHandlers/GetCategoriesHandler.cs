using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.CategoryHandlers;

public class GetCategoriesHandler(ICategoryRepository categoryRepository) : IRequestHandler<GetCategoriesQuery, IReadOnlyCollection<CategoryResponse>>
{
    public async Task<IReadOnlyCollection<CategoryResponse>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken) =>
        (await categoryRepository.GetAllAsync(cancellationToken)).Select(categoryEntity => categoryEntity.ToResponse()).ToArray();
}
