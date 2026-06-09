using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MalakaBooks.Entity
{
  public class BaseObject : BaseId
  {
    public BaseObject()
    {
      DateCreated = DateModified = DateTime.Now;
    }

    public DateTime DateCreated { get; private set; }
    public DateTime DateModified { get; set; }

    public string? Remarks { get; set; }

    public string? ModifiedById { get; set; }
    public string? CreatedById { get; set; }
  }

  public abstract class BaseId
  {
    public BaseId()
    {
      Alias = Guid.NewGuid().ToString();
    }

    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string? Alias { get; set; }
  }
}
