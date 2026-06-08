using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MalakaBooks.Entity;

public class UserEntity
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
    public string Role { get; set; } = "customer";

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
