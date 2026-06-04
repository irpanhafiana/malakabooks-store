using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MalakaBooks.Entity;

public class CartItemEntity
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string BookId { get; set; } = string.Empty;

    public int Quantity { get; set; }
}
