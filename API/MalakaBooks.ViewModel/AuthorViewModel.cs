namespace MalakaBooks.ViewModel;

public class AuthorResponse
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Biography { get; set; } = string.Empty;
    public string PhotoUrl { get; set; } = string.Empty;
    public string Alias { get; set; } = string.Empty;
}

public class CreateAuthorRequest
{
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Biography { get; set; } = string.Empty;
    public string PhotoUrl { get; set; } = string.Empty;
}

public class UpdateAuthorRequest : CreateAuthorRequest
{
}

public class CreateAuthorWithFilesRequest
{
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Biography { get; set; } = string.Empty;
    public Microsoft.AspNetCore.Http.IFormFile? Photo { get; set; }
}

public class UpdateAuthorWithFilesRequest : CreateAuthorWithFilesRequest
{
}
