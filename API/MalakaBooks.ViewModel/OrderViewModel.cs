namespace MalakaBooks.ViewModel;

public class OrderUserResponse
{
    public string UserId { get; set; } = string.Empty;
    public string CustomerGroupCode { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}

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
    public int? IsFragile { get; set; } = 0;
    public string? Size { get; set; }
    public string? PickupServiceType { get; set; } = "Reguler";
    public string? PickupVehicleType { get; set; } = "Mobil";
    public string? ReceiverNote { get; set; } = "tolong video unboxing";
    public List<OrderShipmentBpikDetail>? Bpik { get; set; } = [];
    public string PartnerName { get; set; } = "SIMASRIM";
    public string ReferenceNo { get; set; } = string.Empty;
}

public class OrderShipmentBpikDetail
{
    public string? GoodsName { get; set; }
    public string? GoodsType { get; set; }
    public int? Quantity { get; set; }
}

public class OrderItemResponse
{
    public string ItemId { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string UomCode { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public required string CoverImage { get; set; }
}

public class OrderResponse
{
    public string Id { get; set; } = string.Empty;
    public OrderUserResponse User { get; set; } = new();
    public List<OrderItemResponse> Items { get; set; } = [];
    public string AddressId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public string PaymentId { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string PaymentGateway { get; set; } = string.Empty;
    public string PaymentUrl { get; set; } = string.Empty;
    public string? IncomingPaymentId { get; set; }
    public decimal ItemsSubtotal { get; set; }
    public decimal GrandTotal { get; set; }
    public decimal TotalPrice { get; set; }
    public string Note { get; set; } = string.Empty;

    public decimal ShippingFee { get; set; }
    public decimal ShippingInsurance { get; set; }
    public int ShipmentRetryCount { get; set; }
    public string ShipmentLastError { get; set; } = string.Empty;
    public string ShippingCourier { get; set; } = string.Empty;
    public string ShippingType { get; set; } = string.Empty;
    public string ShippingEst { get; set; } = string.Empty;

    public DateTime? ShipmentCreatedAt { get; set; }
    public DateTime? ShipmentLastAttemptAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public string? AWBNo { get; set; }
}

public class AdminOrderResponse : OrderResponse
{
    public OrderShipmentDetail? ShipmentDetail { get; set; }
}

public class CreateOrderResponse
{
    public bool IsSuccess { get; set; }
    public string Message { get; set; } = string.Empty;
    public Dictionary<string, string> Errors { get; set; } = [];
    public string OrderId { get; set; } = string.Empty;
    public string PaymentUrl { get; set; } = string.Empty;
}

public class SimasrimInsuranceRequest
{
    public decimal NilaiBarang { get; set; }
}

public class SimasrimInsuranceResponse
{
    public string Code { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public SimasrimInsuranceData Data { get; set; } = new();
}

public class SimasrimInsuranceData
{
    public string Ket { get; set; } = string.Empty;
    public decimal NilaiBarang { get; set; }
    public decimal NilaiAsuransi { get; set; }
}

public class CreateOrderItemRequest
{
    public string ItemId { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string UomCode { get; set; } = string.Empty;
    public decimal? Price { get; set; }
    public int Quantity { get; set; }
}

public class CreateOrderRequest
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;

    public List<CreateOrderItemRequest> Items { get; set; } = [];
    public string AddressId { get; set; } = string.Empty;
    public string PaymentId { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
    public string ShippingCourier { get; set; } = string.Empty;
    public string ShippingType { get; set; } = string.Empty;
    public string ShippingEst { get; set; } = string.Empty;
    public decimal ShippingFee { get; set; }
    public bool Insurance { get; set; } = false;
    public decimal ShippingInsurance { get; set; }
}

public class UpdateOrderStatusRequest
{
    public string Status { get; set; } = string.Empty;
}

public class BatchOrderShipmentRequest
{
    public List<string> OrderIds { get; set; } = [];
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

public class ProcessSimasrimShipmentWebhookResult
{
    public string OrderId { get; set; } = string.Empty;
    public bool IsSuccess { get; set; }
    public bool AlreadyProcessed { get; set; }
    public bool ShipmentCreated { get; set; }
    public bool RequiresRetry { get; set; }
    public string Message { get; set; } = string.Empty;
    public string AwbNo { get; set; } = string.Empty;
}

public class CancelOrderShipmentResponse
{
    public string OrderId { get; set; } = string.Empty;
    public bool IsSuccess { get; set; }
    public bool ShipmentCancelled { get; set; }
    public bool RequiresRetry { get; set; }
    public string Message { get; set; } = string.Empty;
    public string AwbNo { get; set; } = string.Empty;
    public string ShipmentLastError { get; set; } = string.Empty;
    public DateTime? ShipmentCreatedAt { get; set; }
    public DateTime? ShipmentLastAttemptAt { get; set; }
}

public class BatchOrderShipmentResponse<TItem>
{
    public int TotalOrders { get; set; }
    public int SuccessCount { get; set; }
    public int FailureCount { get; set; }
    public bool HasFailures => FailureCount > 0;
    public List<TItem> Results { get; set; } = [];
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

public class OrderStatusCountsResponse
{
    public int WaitingForPaymentCount { get; set; }
    public int ProcessCount { get; set; }
    public int DeliveryCount { get; set; }
    public int FinishedCount { get; set; }
}
