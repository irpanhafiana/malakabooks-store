namespace MalakaBooks.ViewModel;

public class BookResponse
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string SAPCode { get; set; } = string.Empty;
    public List<string> AuthorIds { get; set; } = [];
    public List<AuthorResponse> Authors { get; set; } = [];
    public string Isbn { get; set; } = string.Empty;
    public string? CategoryId { get; set; }
    public decimal Price { get; set; }
    public string Description { get; set; } = string.Empty;
    public string CoverImage { get; set; } = string.Empty;
    public string Publisher { get; set; } = string.Empty;
    public int PublishedYear { get; set; }
    public int Pages { get; set; }
    public decimal Weight { get; set; }
    public int Stock { get; set; }
    public double AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<AdditionalImageRequest> AdditionalImages { get; set; } = [];
}

public class CreateBookRequest
{
    public string Title { get; set; } = string.Empty;
    public string SAPCode { get; set; } = string.Empty;
    public List<string> AuthorIds { get; set; } = [];
    public string Isbn { get; set; } = string.Empty;
    public string? CategoryId { get; set; } = null;
    public decimal Price { get; set; }
    public string Description { get; set; } = string.Empty;
    public string CoverImage { get; set; } = string.Empty;
    public string Publisher { get; set; } = string.Empty;
    public int PublishedYear { get; set; }
    public int Pages { get; set; }
    public decimal Weight { get; set; }
    public int Stock { get; set; }
    public List<AdditionalImageRequest> AdditionalImages { get; set; } = [];
}

public class UpdateBookRequest : CreateBookRequest
{
}

public class AdditionalImageRequest
{
    public int No { get; set; }
    public string Image { get; set; } = string.Empty;
}
