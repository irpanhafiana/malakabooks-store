using FluentValidation;
using MalakaBooks.ViewModel;

namespace MalakaBooks.Validator;

public class CreateComplaintRequestValidator : AbstractValidator<CreateComplaintRequest>
{
    private static readonly string[] AllowedCategories = ["MissingItem", "DamagedProduct", "WrongItem", "NotAsDescribed", "FakeProduct", "Other"];
    private static readonly string[] AllowedResolutions = ["FullRefund", "PartialRefund", "Replacement", "Other"];

    public CreateComplaintRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.ItemId).NotEmpty();
        RuleFor(x => x.Subject).NotEmpty();
        RuleFor(x => x.Description).NotEmpty();
        RuleFor(x => x.ReasonCategory).Must(category => AllowedCategories.Contains(category)).WithMessage("Invalid reason category.");
        RuleFor(x => x.RequestedResolution).Must(resolution => AllowedResolutions.Contains(resolution)).WithMessage("Invalid requested resolution.");
    }
}

public class RespondComplaintRequestValidator : AbstractValidator<RespondComplaintRequest>
{
    private static readonly string[] AllowedStatuses = ["open", "in_progress", "resolved", "closed"];
    private static readonly string[] AllowedResolutionOutcomes = ["Refunded", "Replaced", "Rejected", "Other"];

    public RespondComplaintRequestValidator()
    {
        RuleFor(x => x.Status).Must(status => AllowedStatuses.Contains(status)).WithMessage("Invalid complaint status.");
        RuleFor(x => x.Message).NotEmpty();
        RuleFor(x => x.SenderId).NotEmpty();
        RuleFor(x => x.SenderType).Must(senderType => senderType is "customer" or "admin").WithMessage("Invalid complaint sender type.");
        
        When(x => x.Status == "closed" || x.Status == "resolved", () =>
        {
            RuleFor(x => x.ResolutionOutcome).Must(outcome => AllowedResolutionOutcomes.Contains(outcome))
                .WithMessage("Resolution outcome is required and must be valid when closing or resolving a complaint.");
        });
    }
}
