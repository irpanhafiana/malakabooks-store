using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.CategoryHandlers;

public class GetCategoryByIdHandler(ICategoryRepository categoryRepository) : IRequestHandler<GetCategoryByIdQuery, CategoryResponse?>
{
    public async Task<CategoryResponse?> Handle(GetCategoryByIdQuery request, CancellationToken cancellationToken) =>
        (await categoryRepository.GetByIdAsync(request.Id, cancellationToken))?.ToResponse();
}
