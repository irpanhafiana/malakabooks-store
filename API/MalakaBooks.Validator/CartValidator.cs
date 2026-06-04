using FluentValidation;
using MalakaBooks.ViewModel;

namespace MalakaBooks.Validator;

public class AddCartItemRequestValidator : AbstractValidator<AddCartItemRequest>
{
    public AddCartItemRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.BookId).NotEmpty();
        RuleFor(x => x.Quantity).GreaterThan(0);
    }
}

public class RemoveCartItemRequestValidator : AbstractValidator<RemoveCartItemRequest>
{
    public RemoveCartItemRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.BookId).NotEmpty();
    }
}
