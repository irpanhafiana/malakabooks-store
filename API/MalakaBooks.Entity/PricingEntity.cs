using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MalakaBooks.Entity;

public class PricingEntity : BaseObject
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string CustomerGroupCode { get; set; } = string.Empty;

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime StartDate { get; set; }

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime EndDate { get; set; }

    public bool IsActive { get; set; } = true;
    public List<PricingDetailEntity> Details { get; set; } = [];

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class PricingDetailEntity
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string ItemId { get; set; } = string.Empty;

    public string UomCode { get; set; } = string.Empty;
    public decimal Price { get; set; }
}
