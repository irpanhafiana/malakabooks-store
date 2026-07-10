using FluentValidation;
using MalakaBooks.ViewModel;
using Mardika.Simasrim.Service.Model;

namespace MalakaBooks.Validator;

public class CreateOrderRequestValidator : AbstractValidator<CreateOrderRequest>
{
    public CreateOrderRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.AddressId).NotEmpty();
        RuleFor(x => x.PaymentId).NotEmpty();
        RuleFor(x => x.ShippingCourier).NotEmpty();
        RuleFor(x => x.ShippingType).NotEmpty();
        RuleFor(x => x.ShippingEst).NotEmpty();
        RuleFor(x => x.ShippingFee).GreaterThanOrEqualTo(0);
        RuleFor(x => x.ShippingInsurance).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Items).NotEmpty();
        RuleForEach(x => x.Items).SetValidator(new CreateOrderItemRequestValidator());

        When(x => !x.Insurance, () =>
        {
            RuleFor(x => x.ShippingInsurance).Equal(0);
        });
    }
}

public class CreateOrderItemRequestValidator : AbstractValidator<CreateOrderItemRequest>
{
    public CreateOrderItemRequestValidator()
    {
        RuleFor(x => x)
            .Must(item => !string.IsNullOrWhiteSpace(item.BookId) || !string.IsNullOrWhiteSpace(item.ItemId))
            .WithMessage("Either BookId or ItemId must be provided.");
        RuleFor(x => x.Title).NotEmpty();
        RuleFor(x => x.UomCode).NotEmpty();
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0).When(x => x.Price.HasValue);
        RuleFor(x => x.Quantity).GreaterThan(0);
    }
}

public class UpdateOrderStatusRequestValidator : AbstractValidator<UpdateOrderStatusRequest>
{
    private static readonly string[] AllowedStatuses = ["pending_payment", "ready_to_ship", "shipped", "expired", "cancelled"];

    public UpdateOrderStatusRequestValidator()
    {
        RuleFor(x => x.Status)
            .Must(status => AllowedStatuses.Contains(status, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Invalid order status.");
    }
}

public class SimasrimCreateResiRequestValidator : AbstractValidator<SimasrimCreateResiRequest>
{
    private static readonly string[] AllowedShipmentTypes = ["DROP", "PICKUP"];
    private static readonly string[] AllowedToggleValues = ["yes", "no"];
    private static readonly string[] AllowedJnePickupServices = ["Reguler", "Domestic"];
    private static readonly string[] AllowedJnePickupVehicles = ["Motor", "Mobil", "Truck"];
    private static readonly string[] PaxelCouriers = ["paxel"];
    private static readonly string[] LionAndPaxelCouriers = ["lion", "paxel"];
    private static readonly string[] ItemTypeRequiredCouriers = ["sapx", "jntc", "lion"];

    public SimasrimCreateResiRequestValidator()
    {
        RuleFor(x => x.Courier).NotEmpty();
        RuleFor(x => x.PickupName).NotEmpty();
        RuleFor(x => x.PickupDate).NotEmpty();
        RuleFor(x => x.PickupPhoneNumber).NotEmpty();
        RuleFor(x => x.PickupAddress).NotEmpty();
        RuleFor(x => x.PickupAddressId).NotEmpty();
        RuleFor(x => x.SenderName).NotEmpty();
        RuleFor(x => x.SenderAddress).NotEmpty();
        RuleFor(x => x.SenderAddressId).NotEmpty();
        RuleFor(x => x.SenderPhoneNumber).NotEmpty();
        RuleFor(x => x.ReceiverName).NotEmpty();
        RuleFor(x => x.ReceiverAddress).NotEmpty();
        RuleFor(x => x.ReceiverAddressId).NotEmpty();
        RuleFor(x => x.ReceiverPhoneNumber).NotEmpty();
        RuleFor(x => x.Type).NotEmpty().Must(BeOneOf).WithMessage("type must be DROP or PICKUP.");
        RuleFor(x => x.ItemWeight).NotEmpty();
        RuleFor(x => x.ServiceType).NotEmpty();
        RuleFor(x => x.ServicePrice).NotEmpty();
        RuleFor(x => x.ServiceEstimate).NotEmpty();
        RuleFor(x => x.Quantity).NotEmpty();
        RuleFor(x => x.WoodenPacking).NotEmpty().Must(BeToggleValue).WithMessage("packing_kayu must be yes or no.");
        RuleFor(x => x.Insurance).NotEmpty().Must(BeToggleValue).WithMessage("asuransi must be yes or no.");
        RuleFor(x => x.Volume).NotEmpty();
        RuleFor(x => x.ItemName).NotEmpty();
        RuleFor(x => x.CourierInstruction).NotEmpty();
        RuleFor(x => x.PartnerName).NotEmpty().Equal("SIMASRIM");

        When(x => IsOneOfCouriers(x.Courier, ItemTypeRequiredCouriers), () =>
        {
            RuleFor(x => x.ItemType).NotEmpty();
        });

        When(x => IsOneOfCouriers(x.Courier, LionAndPaxelCouriers), () =>
        {
            RuleFor(x => x.PickupZipCode).NotEmpty();
            RuleFor(x => x.ReceiverZipCode).NotEmpty();
            RuleFor(x => x.SenderLongitude).NotEmpty();
            RuleFor(x => x.SenderLatitude).NotEmpty();
            RuleFor(x => x.ReceiverLongitude).NotEmpty();
            RuleFor(x => x.ReceiverLatitude).NotEmpty();
        });

        When(x => IsOneOfCouriers(x.Courier, PaxelCouriers), () =>
        {
            RuleFor(x => x.ItemCode).NotEmpty();
            RuleFor(x => x.ItemCategory).NotEmpty();
            RuleFor(x => x.IsFragile).NotNull().Must(value => value is 0 or 1).WithMessage("is_fragile must be 0 or 1.");
            RuleFor(x => x.Size).NotEmpty();
        });

        When(x => string.Equals(x.Courier, "jne", StringComparison.OrdinalIgnoreCase), () =>
        {
            RuleFor(x => x.PickupServiceType).NotEmpty().Must(BeAllowedJnePickupService).WithMessage("layanan_pickup must be Reguler or Domestic.");
            RuleFor(x => x.PickupVehicleType).NotEmpty().Must(BeAllowedJnePickupVehicle).WithMessage("kendaraan_pickup must be Motor, Mobil, or Truck.");
            RuleFor(x => x.ReceiverNote).NotEmpty();
        });

        When(x => string.Equals(x.Insurance, "yes", StringComparison.OrdinalIgnoreCase), () =>
        {
            RuleFor(x => x.Bpik).NotEmpty();
            RuleForEach(x => x.Bpik!).SetValidator(new SimasrimBpikRequestValidator());
        });
    }

    private static bool BeOneOf(string? value)
        => !string.IsNullOrWhiteSpace(value) && AllowedShipmentTypes.Contains(value, StringComparer.OrdinalIgnoreCase);

    private static bool BeToggleValue(string? value)
        => !string.IsNullOrWhiteSpace(value) && AllowedToggleValues.Contains(value, StringComparer.OrdinalIgnoreCase);

    private static bool BeAllowedJnePickupService(string? value)
        => !string.IsNullOrWhiteSpace(value) && AllowedJnePickupServices.Contains(value, StringComparer.OrdinalIgnoreCase);

    private static bool BeAllowedJnePickupVehicle(string? value)
        => !string.IsNullOrWhiteSpace(value) && AllowedJnePickupVehicles.Contains(value, StringComparer.OrdinalIgnoreCase);

    private static bool IsOneOfCouriers(string? courier, string[] allowedCouriers)
        => !string.IsNullOrWhiteSpace(courier) && allowedCouriers.Contains(courier, StringComparer.OrdinalIgnoreCase);
}

public class SimasrimBpikRequestValidator : AbstractValidator<SimasrimBpikRequest>
{
    public SimasrimBpikRequestValidator()
    {
        RuleFor(x => x.GoodsName).NotNull();
        RuleFor(x => x.GoodsType).NotEmpty();
        RuleFor(x => x.Quantity).GreaterThan(0);
    }
}
