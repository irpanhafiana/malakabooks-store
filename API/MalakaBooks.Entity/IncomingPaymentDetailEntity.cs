using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MalakaBooks.Entity;

public class IncomingPaymentDetailEntity
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string OrderId { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public string Note { get; set; } = string.Empty;
}
