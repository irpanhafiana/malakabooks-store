using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MalakaBooks.Entity;

public class ReviewEntity : BaseObject
{
  [BsonRepresentation(BsonType.ObjectId)]
  public string UserId { get; set; } = string.Empty;

  [BsonRepresentation(BsonType.ObjectId)]
  public string BookId { get; set; } = string.Empty;

  [BsonRepresentation(BsonType.ObjectId)]
  public string OrderId { get; set; } = string.Empty;

  public int Rating { get; set; }
  public string Comment { get; set; } = string.Empty;

  [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
