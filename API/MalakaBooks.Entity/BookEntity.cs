using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MalakaBooks.Entity;

public class BookEntity : BaseObject
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string ItemId { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public List<string> AuthorIds { get; set; } = [];

    public string Isbn { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string? CategoryId { get; set; } = null;

    public string Publisher { get; set; } = string.Empty;
    public int PublishedYear { get; set; }
    public int Pages { get; set; }
    public double AverageRating { get; set; }
    public int TotalReviews { get; set; }

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class AdditionalImage
{
    public int No { get; set; }
    public required string Image { get; set; }
}
