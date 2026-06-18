using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MalakaBooks.Entity;

public class IncomingPaymentEntity : BaseObject
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string OrderId { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;
    public string Gateway { get; set; } = "DOKU";
    public string PaymentMethod { get; set; } = "QRIS";
    public string Status { get; set; } = "paid";
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "IDR";
    public string ReferenceNo { get; set; } = string.Empty;
    public string GatewayReference { get; set; } = string.Empty;
    public string GatewayInvoiceNumber { get; set; } = string.Empty;
    public string RawNotification { get; set; } = string.Empty;
    public List<IncomingPaymentDetailEntity> Details { get; set; } = [];

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime PaidAt { get; set; } = DateTime.UtcNow;

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
