using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MalakaBooks.Entity;

public class ItemEntity : BaseObject
{
    public string Name { get; set; } = string.Empty;
    public string SAPCode { get; set; } = string.Empty;
    public string ItemType { get; set; } = string.Empty;
    public string CoverImage { get; set; } = string.Empty;
    public List<AdditionalImage> AdditionalImages { get; set; } = [];

    [BsonRepresentation(BsonType.ObjectId)]
    public string? UomGroupId { get; set; }

    public string BaseUomCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Weight { get; set; }
    public int Stock { get; set; }
    public bool IsActive { get; set; } = true;

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
