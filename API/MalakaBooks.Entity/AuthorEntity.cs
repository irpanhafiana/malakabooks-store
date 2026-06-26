namespace MalakaBooks.Entity;

public class AuthorEntity : BaseObject
{
    public string Name { get; set; } = string.Empty;
    public string Biography { get; set; } = string.Empty;
    public string PhotoUrl { get; set; } = string.Empty;
}
