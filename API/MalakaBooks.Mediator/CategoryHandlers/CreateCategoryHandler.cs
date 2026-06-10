using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MediatR;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.Mediator.CategoryHandlers;

public class CreateCategoryHandler(ICategoryRepository categoryRepository, ICategoryEntityValidator validator) : IRequestHandler<CreateCategoryCommand, ValidationResult?>
{
  private readonly ICategoryEntityValidator _validator = validator;

  public async Task<ValidationResult?> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
  {
    var entity = request.Request.ToEntity();

    var result = await _validator.CreateValidateAsync(entity);
    if (result == null)
    {
      await categoryRepository.CreateAsync(entity, cancellationToken);
    }

    return result;
  }

}
