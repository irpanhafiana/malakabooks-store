using FluentValidation;
using MalakaBooks.ViewModel;

namespace MalakaBooks.Validator;

public class CreateBookRequestValidator : AbstractValidator<CreateBookRequest>
{
    public CreateBookRequestValidator()
    {
        RuleFor(x => x.ItemId).NotEmpty();
        RuleFor(x => x.Isbn).NotEmpty();
        RuleFor(x => x.PublishedYear).GreaterThan(0);
        RuleFor(x => x.Pages).GreaterThan(0);
    }
}

public class UpdateBookRequestValidator : AbstractValidator<UpdateBookRequest>
{
    public UpdateBookRequestValidator()
    {
        Include(new CreateBookRequestValidator());
    }
}
