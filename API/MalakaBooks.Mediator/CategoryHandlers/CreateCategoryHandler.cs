using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.CategoryHandlers;

public class CreateCategoryHandler(ICategoryRepository categoryRepository, ICategoryEntityValidator validator) : IRequestHandler<CreateCategoryCommand, CategoryResponse>
{
  public ICategoryEntityValidator Validator { get; } = validator;

  public async Task<CategoryResponse> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
  {
    var entity = request.Request.ToEntity();

    var result = await Validator.CreateValidateAsync(entity);
    if (result == null)
    {

      await categoryRepository.CreateAsync(entity, cancellationToken);
      return entity.ToResponse();
    }

    return new();
  }

}
