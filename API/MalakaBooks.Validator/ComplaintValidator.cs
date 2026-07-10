using FluentValidation;
using MalakaBooks.ViewModel;

namespace MalakaBooks.Validator;

public class CreateComplaintRequestValidator : AbstractValidator<CreateComplaintRequest>
{
    public CreateComplaintRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.BookId).NotEmpty();
        RuleFor(x => x.Subject).NotEmpty();
        RuleFor(x => x.Description).NotEmpty();
    }
}

public class RespondComplaintRequestValidator : AbstractValidator<RespondComplaintRequest>
{
    private static readonly string[] AllowedStatuses = ["open", "in_progress", "resolved", "closed"];

    public RespondComplaintRequestValidator()
    {
        RuleFor(x => x.Status).Must(status => AllowedStatuses.Contains(status)).WithMessage("Invalid complaint status.");
        RuleFor(x => x.Message).NotEmpty();
        RuleFor(x => x.SenderId).NotEmpty();
        RuleFor(x => x.SenderType).Must(senderType => senderType is "customer" or "admin").WithMessage("Invalid complaint sender type.");
    }
}
