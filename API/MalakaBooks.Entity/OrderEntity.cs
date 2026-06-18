using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MalakaBooks.Entity;

public class OrderEntity : BaseObject
{
    public string UserId { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;

    public List<OrderItemEntity> Items { get; set; } = [];

    [BsonRepresentation(BsonType.ObjectId)]
    public string AddressId { get; set; } = string.Empty;

    public string Status { get; set; } = "pending";
    public string PaymentStatus { get; set; } = "unpaid";
    public string PaymentMethod { get; set; } = string.Empty;
    public string PaymentGateway { get; set; } = string.Empty;
    public string PaymentUrl { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string? IncomingPaymentId { get; set; }

    public decimal TotalPrice { get; set; }
    public string Note { get; set; } = string.Empty;

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? PaidAt { get; set; }

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
