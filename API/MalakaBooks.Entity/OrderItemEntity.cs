using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MalakaBooks.Entity;

public class OrderItemEntity : BaseObject
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string BookId { get; set; } = string.Empty;
    public string BookName { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
}
