using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MalakaBooks.Entity;

public class ComplaintEntity : BaseObject
{
    public string UserId { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string OrderId { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string BookId { get; set; } = string.Empty;

    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "open";

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<AdditionalImage> AdditionalImages { get; set; } = [];
    public List<ComplaintMessageEntity> Messages { get; set; } = [];
}

public class ComplaintMessageEntity
{
    public string SenderType { get; set; } = string.Empty;
    public string SenderId { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public List<AdditionalImage> AdditionalImages { get; set; } = [];

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
