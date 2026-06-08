namespace MalakaBooks.ViewModel;

public class ComplaintResponse
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string OrderId { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string AdminResponse { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateComplaintRequest
{
    public string UserId { get; set; } = string.Empty;
    public string OrderId { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class RespondComplaintRequest
{
    public string Status { get; set; } = string.Empty;
    public string AdminResponse { get; set; } = string.Empty;
}
