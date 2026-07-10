using MongoDB.Bson.Serialization.Attributes;

namespace MalakaBooks.Entity;

public class WarehouseEntity : BaseObject
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class WarehouseStockEntity : BaseObject
{
    public string BaseUomCode { get; set; } = string.Empty;

    [MongoDB.Bson.Serialization.Attributes.BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
    public string WarehouseId { get; set; } = string.Empty;

    [MongoDB.Bson.Serialization.Attributes.BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
    public string ItemId { get; set; } = string.Empty;

    public decimal QuantityOnHand { get; set; }
    public decimal ReservedQuantity { get; set; }

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
