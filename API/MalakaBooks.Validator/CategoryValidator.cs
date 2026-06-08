using FluentValidation;
using MalakaBooks.ViewModel;

namespace MalakaBooks.Validator;

public class CreateCategoryRequestValidator : AbstractValidator<CreateCategoryRequest>
{
    public CreateCategoryRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty();
        RuleFor(x => x.Slug).NotEmpty();
    }
}

public class UpdateCategoryRequestValidator : AbstractValidator<UpdateCategoryRequest>
{
    public UpdateCategoryRequestValidator()
    {
        Include(new CreateCategoryRequestValidator());
    }
}
