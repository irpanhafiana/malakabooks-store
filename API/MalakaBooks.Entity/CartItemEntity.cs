using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MalakaBooks.Entity;

[BsonIgnoreExtraElements]
public class CartItemEntity : BaseObject
{
    public string UserId { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string ItemId { get; set; } = string.Empty;

    public string UomCode { get; set; } = string.Empty;

    public int Quantity { get; set; }
}
