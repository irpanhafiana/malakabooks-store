using FluentValidation;
using MalakaBooks.ViewModel;

namespace MalakaBooks.Validator;

public class CreateHomeAddressRequestValidator : AbstractValidator<CreateHomeAddressRequest>
{
    public CreateHomeAddressRequestValidator()
    {
        RuleFor(x => x.Label).NotEmpty();
        RuleFor(x => x.RecipientName).NotEmpty();
        RuleFor(x => x.Phone).NotEmpty();
        RuleFor(x => x.Street).NotEmpty();
        RuleFor(x => x.City).NotEmpty();
        RuleFor(x => x.Province).NotEmpty();
        RuleFor(x => x.PostalCode).NotEmpty();
    }
}

public class UpdateHomeAddressRequestValidator : AbstractValidator<UpdateHomeAddressRequest>
{
    public UpdateHomeAddressRequestValidator()
    {
        Include(new CreateHomeAddressRequestValidator());
    }
}
