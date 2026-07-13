namespace MalakaBooks.ViewModel;

public class ComplaintResponse
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string OrderId { get; set; } = string.Empty;
    public string ItemId { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<AdditionalImageRequest> AdditionalImages { get; set; } = [];
    public List<ComplaintMessageResponse> Messages { get; set; } = [];
}

public class ComplaintMessageResponse
{
    public string SenderType { get; set; } = string.Empty;
    public string SenderId { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public List<AdditionalImageRequest> AdditionalImages { get; set; } = [];
    public DateTime CreatedAt { get; set; }
}

public class CreateComplaintRequest
{
    public string UserId { get; set; } = string.Empty;
    public string OrderId { get; set; } = string.Empty;
    public string ItemId { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<AdditionalImageRequest> AdditionalImages { get; set; } = [];
}

public class RespondComplaintRequest
{
    public string Status { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string SenderId { get; set; } = string.Empty;
    public string SenderType { get; set; } = string.Empty;
    public List<AdditionalImageRequest> AdditionalImages { get; set; } = [];
}
