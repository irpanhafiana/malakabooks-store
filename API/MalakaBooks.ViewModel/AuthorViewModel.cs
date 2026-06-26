namespace MalakaBooks.ViewModel;

public class AuthorResponse
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Biography { get; set; } = string.Empty;
    public string PhotoUrl { get; set; } = string.Empty;
    public string Alias { get; set; } = string.Empty;
}

public class CreateAuthorRequest
{
    public string Name { get; set; } = string.Empty;
    public string Biography { get; set; } = string.Empty;
    public string PhotoUrl { get; set; } = string.Empty;
}

public class UpdateAuthorRequest : CreateAuthorRequest
{
}
