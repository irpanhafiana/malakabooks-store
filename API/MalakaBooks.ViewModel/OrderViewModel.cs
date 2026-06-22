using Mardika.Simasrim.Service.Model;

namespace MalakaBooks.ViewModel;

public class OrderShipmentDetail
{
    public string Courier { get; set; } = string.Empty;
    public string PickupName { get; set; } = string.Empty;
    public string PickupDate { get; set; } = string.Empty;
    public string PickupPhoneNumber { get; set; } = string.Empty;
    public string PickupAddress { get; set; } = string.Empty;
    public string PickupAddressId { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string SenderAddress { get; set; } = string.Empty;
    public string SenderAddressId { get; set; } = string.Empty;
    public string SenderPhoneNumber { get; set; } = string.Empty;
    public string ReceiverName { get; set; } = string.Empty;
    public string ReceiverAddress { get; set; } = string.Empty;
    public string ReceiverAddressId { get; set; } = string.Empty;
    public string ReceiverPhoneNumber { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string ItemWeight { get; set; } = string.Empty;
    public string ServiceType { get; set; } = string.Empty;
    public string ServicePrice { get; set; } = string.Empty;
    public string ServiceEstimate { get; set; } = string.Empty;
    public string Quantity { get; set; } = string.Empty;
    public string WoodenPacking { get; set; } = string.Empty;
    public string Insurance { get; set; } = string.Empty;
    public decimal ItemValueAmount { get; set; }
    public string ItemType { get; set; } = string.Empty;
    public string Volume { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string CourierInstruction { get; set; } = string.Empty;
    public string? PickupZipCode { get; set; }
    public string? ReceiverZipCode { get; set; }
    public string? SenderLongitude { get; set; }
    public string? SenderLatitude { get; set; }
    public string? ReceiverLongitude { get; set; }
    public string? ReceiverLatitude { get; set; }
    public string? ItemCode { get; set; }
    public string? ItemCategory { get; set; }
    public int? IsFragile { get; set; }
    public string? Size { get; set; }
    public string? PickupServiceType { get; set; }
    public string? PickupVehicleType { get; set; }
    public string? ReceiverNote { get; set; }
    public List<OrderShipmentBpikDetail>? Bpik { get; set; }
    public string PartnerName { get; set; } = string.Empty;
}

public class OrderShipmentBpikDetail
{
    public decimal? ItemValue { get; set; }
    public string? ItemType { get; set; }
    public string? SerialNumber { get; set; }
    public decimal? InsuranceAmount { get; set; }
    public string? Color { get; set; }
    public string? Condition { get; set; }
}

public class OrderItemResponse
{
    public string BookId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
}

public class OrderResponse
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public List<OrderItemResponse> Items { get; set; } = [];
    public string AddressId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string PaymentGateway { get; set; } = string.Empty;
    public string PaymentUrl { get; set; } = string.Empty;
    public string? IncomingPaymentId { get; set; }
    public decimal ItemsSubtotal { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal GrandTotal { get; set; }
    public decimal TotalPrice { get; set; }
    public string Note { get; set; } = string.Empty;
    public OrderShipmentDetail? ShipmentDetail { get; set; }
    public int ShipmentRetryCount { get; set; }
    public string ShipmentLastError { get; set; } = string.Empty;
    public DateTime? ShipmentCreatedAt { get; set; }
    public DateTime? ShipmentLastAttemptAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateOrderResponse
{
    public bool IsSuccess { get; set; }
    public Dictionary<string, string> Errors { get; set; } = [];
    public string OrderId { get; set; } = string.Empty;
    public string PaymentUrl { get; set; } = string.Empty;
}

public class CreateOrderItemRequest
{
    public string BookId { get; set; } = string.Empty;
    public string BookName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
}

public class CreateOrderRequest
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;

    public List<CreateOrderItemRequest> Items { get; set; } = [];
    public string AddressId { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
    public decimal ShippingFee { get; set; }
    public SimasrimCreateResiRequest? SimasrimRequest { get; set; }
}

public class UpdateOrderStatusRequest
{
    public string Status { get; set; } = string.Empty;
}

public static class OrderStatuses
{
    public const string PendingPayment = "pending_payment";
    public const string ReadyToShip = "ready_to_ship";
    public const string Shipped = "shipped";
    public const string Expired = "expired";
    public const string Cancelled = "cancelled";
}

public class RecheckOrderShipmentResponse
{
    public string OrderId { get; set; } = string.Empty;
    public bool IsSuccess { get; set; }
    public bool AlreadySynchronized { get; set; }
    public bool RequiresManualReview { get; set; }
    public string Message { get; set; } = string.Empty;
    public string AwbNo { get; set; } = string.Empty;
    public string ShipmentLastError { get; set; } = string.Empty;
    public DateTime? ShipmentCreatedAt { get; set; }
    public DateTime? ShipmentLastAttemptAt { get; set; }
}

public class CreateOrderShipmentResponse
{
    public string OrderId { get; set; } = string.Empty;
    public bool IsSuccess { get; set; }
    public bool AlreadyProcessed { get; set; }
    public bool ShipmentCreated { get; set; }
    public bool RequiresRetry { get; set; }
    public int ShipmentRetryCount { get; set; }
    public string Message { get; set; } = string.Empty;
    public string AwbNo { get; set; } = string.Empty;
    public string ShipmentLastError { get; set; } = string.Empty;
    public DateTime? ShipmentCreatedAt { get; set; }
    public DateTime? ShipmentLastAttemptAt { get; set; }
}
