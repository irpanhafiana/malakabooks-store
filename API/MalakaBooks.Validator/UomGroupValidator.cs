using FluentValidation;
using MalakaBooks.ViewModel;
using System.Linq;

namespace MalakaBooks.Validator;

public class CreateUomGroupRequestValidator : AbstractValidator<CreateUomGroupRequest>
{
    public CreateUomGroupRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty();
        RuleFor(x => x.Details).NotNull();

        // Ensure there is exactly one default for sales
        RuleFor(x => x.Details)
            .Must(details => details != null && details.Count(d => d.IsDefaultForSales) == 1)
            .WithMessage("Exactly one UoM detail must be marked as default for sales.");

        // Ensure there is exactly one base UoM
        RuleFor(x => x.Details)
            .Must(details => details != null && details.Count(d => d.IsBaseUom) == 1)
            .WithMessage("Exactly one UoM detail must be marked as base UoM.");

        // Basic detail validations
        RuleForEach(x => x.Details).ChildRules(detail =>
        {
            detail.RuleFor(d => d.Code).NotEmpty();
            detail.RuleFor(d => d.Name).NotEmpty();
        });
    }
}

public class UpdateUomGroupRequestValidator : AbstractValidator<UpdateUomGroupRequest>
{
    public UpdateUomGroupRequestValidator()
    {
        Include(new CreateUomGroupRequestValidator());
    }
}
