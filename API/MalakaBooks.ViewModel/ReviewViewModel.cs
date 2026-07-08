namespace MalakaBooks.ViewModel;

public class ReviewResponse
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string BookId { get; set; } = string.Empty;
    public string OrderId { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public List<AdditionalImageRequest> AdditionalImages { get; set; } = [];
    public DateTime CreatedAt { get; set; }
}

public class CreateReviewRequest
{
    public string UserId { get; set; } = string.Empty;
    public string BookId { get; set; } = string.Empty;
    public string OrderId { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public List<AdditionalImageRequest> AdditionalImages { get; set; } = [];
}
