using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MalakaBooks.Entity;

public class BookEntity : BaseObject
{
  public string Title { get; set; } = string.Empty;
  public string Author { get; set; } = string.Empty;
  public string Isbn { get; set; } = string.Empty;

  [BsonRepresentation(BsonType.ObjectId)]
  public string CategoryId { get; set; } = string.Empty;

  public decimal Price { get; set; }
  public string Description { get; set; } = string.Empty;
  public string CoverImage { get; set; } = string.Empty;
  public string Publisher { get; set; } = string.Empty;
  public int PublishedYear { get; set; }
  public int Pages { get; set; }
  public decimal Weight { get; set; }
  public int Stock { get; set; }
  public double AverageRating { get; set; }
  public int TotalReviews { get; set; }

  [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
