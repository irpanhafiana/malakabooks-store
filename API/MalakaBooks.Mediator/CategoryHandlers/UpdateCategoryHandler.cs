using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;

namespace MalakaBooks.Mediator.CategoryHandlers;

public class UpdateCategoryHandler(ICategoryRepository categoryRepository, ICategoryEntityValidator validator) : IRequestHandler<UpdateCategoryCommand, bool>
{
    private readonly ICategoryEntityValidator _validator = validator;

    public async Task<bool> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var entity = await categoryRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null) return false;

        var result = await _validator.UpdateValidateAsync(entity);
        if (result is not null) return false;

        entity.UpdateFrom(request.Request);
        return await categoryRepository.UpdateAsync(request.Id, entity, cancellationToken);
    }
}
