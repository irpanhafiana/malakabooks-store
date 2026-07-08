using FluentValidation;
using MalakaBooks.ViewModel;

namespace MalakaBooks.Validator;

public class CreatePromotionBannerRequestValidator : AbstractValidator<CreatePromotionBannerRequest>
{
    public CreatePromotionBannerRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty();
        RuleFor(x => x.ImageBase64).NotEmpty();
        RuleFor(x => x.TargetUrl)
            .NotEmpty()
            .Must(uri => Uri.TryCreate(uri, UriKind.Absolute, out _))
            .WithMessage("TargetUrl must be a valid absolute URL.");
        RuleFor(x => x.DisplayOrder).GreaterThanOrEqualTo(0);
        RuleFor(x => x.EndAt)
            .GreaterThanOrEqualTo(x => x.StartAt!.Value)
            .When(x => x.StartAt.HasValue && x.EndAt.HasValue)
            .WithMessage("EndAt must be greater than or equal to StartAt.");
    }
}
