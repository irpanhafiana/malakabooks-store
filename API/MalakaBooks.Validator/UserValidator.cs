using FluentValidation;
using MalakaBooks.ViewModel;

namespace MalakaBooks.Validator;

public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
  public UpdateUserRequestValidator()
  {
    RuleFor(x => x.Name).NotEmpty();
    RuleFor(x => x.Phone).NotEmpty();
  }
}
