using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MalakaBooks.Entity;

public class OrderUserEntity
{
    public string UserId { get; set; } = string.Empty;
    public string CustomerGroupCode { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}

public class OrderEntity : BaseObject
{
    public OrderUserEntity User { get; set; } = new();

    public List<OrderItemEntity> Items { get; set; } = [];

    [BsonRepresentation(BsonType.ObjectId)]
    public string AddressId { get; set; } = string.Empty;

    public string Status { get; set; } = "pending";
    public string PaymentStatus { get; set; } = "unpaid";

    [BsonRepresentation(BsonType.ObjectId)]
    public string PaymentId { get; set; } = string.Empty;

    public string PaymentMethod { get; set; } = string.Empty;
    public string PaymentGateway { get; set; } = string.Empty;
    public string PaymentUrl { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string? IncomingPaymentId { get; set; }

    public decimal ItemsSubtotal { get; set; }
    public string ShippingCourier { get; set; } = string.Empty;
    public string ShippingType { get; set; } = string.Empty;
    public string ShippingEst { get; set; } = string.Empty;
    public decimal ShippingFee { get; set; }
    public decimal ShippingInsurance { get; set; }

    public decimal GrandTotal { get; set; }
    public decimal TotalPrice { get; set; }
    public string Note { get; set; } = string.Empty;
    public string ShipmentDetailJson { get; set; } = string.Empty;
    public int ShipmentRetryCount { get; set; }
    public string ShipmentLastError { get; set; } = string.Empty;

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? ShipmentCreatedAt { get; set; }

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? ShipmentLastAttemptAt { get; set; }

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? PaidAt { get; set; }

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? ExpiresAt { get; set; }

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public string? AWBNo { get; set; }
}
