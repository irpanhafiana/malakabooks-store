using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MalakaBooks.Entity;

public class ComplaintEntity : BaseObject
{
  [BsonRepresentation(BsonType.ObjectId)]
  public string UserId { get; set; } = string.Empty;

  [BsonRepresentation(BsonType.ObjectId)]
  public string OrderId { get; set; } = string.Empty;

  public string Subject { get; set; } = string.Empty;
  public string Description { get; set; } = string.Empty;
  public string Status { get; set; } = "open";
  public string AdminResponse { get; set; } = string.Empty;

  [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

  [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
  public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
