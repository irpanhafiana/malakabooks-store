using FluentValidation;
using MalakaBooks.ViewModel;

namespace MalakaBooks.Validator;

public class CreateOrderRequestValidator : AbstractValidator<CreateOrderRequest>
{
    public CreateOrderRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.AddressId).NotEmpty();
        RuleFor(x => x.Items).NotEmpty();
        RuleForEach(x => x.Items).SetValidator(new CreateOrderItemRequestValidator());
    }
}

public class CreateOrderItemRequestValidator : AbstractValidator<CreateOrderItemRequest>
{
    public CreateOrderItemRequestValidator()
    {
        RuleFor(x => x.BookId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty();
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Quantity).GreaterThan(0);
    }
}

public class UpdateOrderStatusRequestValidator : AbstractValidator<UpdateOrderStatusRequest>
{
    private static readonly string[] AllowedStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

    public UpdateOrderStatusRequestValidator()
    {
        RuleFor(x => x.Status).Must(status => AllowedStatuses.Contains(status)).WithMessage("Invalid order status.");
    }
}
