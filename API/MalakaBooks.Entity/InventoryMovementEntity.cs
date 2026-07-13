using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MalakaBooks.Entity;

public class InventoryMovementEntity : BaseObject
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string ItemId { get; set; } = string.Empty;

    public string ItemName { get; set; } = string.Empty;
    public string MovementType { get; set; } = string.Empty;
    public int QuantityDelta { get; set; }
    public int StockBefore { get; set; }
    public int StockAfter { get; set; }
    public string ReferenceId { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
