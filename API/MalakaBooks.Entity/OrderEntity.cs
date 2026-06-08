using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MalakaBooks.Entity;

public class OrderEntity : BaseObject
{
  [BsonRepresentation(BsonType.ObjectId)]
  public string UserId { get; set; } = string.Empty;

  public List<OrderItemEntity> Items { get; set; } = new();

  [BsonRepresentation(BsonType.ObjectId)]
  public string AddressId { get; set; } = string.Empty;

  public string Status { get; set; } = "pending";
  public decimal TotalPrice { get; set; }
  public string Note { get; set; } = string.Empty;

  [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

  [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
  public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
