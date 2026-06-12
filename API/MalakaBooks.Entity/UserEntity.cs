using MongoDB.Bson.Serialization.Attributes;

namespace MalakaBooks.Entity;

public class UserEntity : BaseObject
{
    public string UserId { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;

    // Role, Email, Password are managed by IS4 (stored in IS4 claims, not here)

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
