namespace MalakaBooks.ViewModel;

public class PromotionBannerResponse
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string ImageBase64 { get; set; } = string.Empty;
    public string TargetUrl { get; set; } = string.Empty;
    public string ButtonText { get; set; } = string.Empty;
    public string TargetType { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int DisplayOrder { get; set; }
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string Alias { get; set; } = string.Empty;
}

public class CreatePromotionBannerRequest
{
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string ImageBase64 { get; set; } = string.Empty;
    public string TargetUrl { get; set; } = string.Empty;
    public string ButtonText { get; set; } = string.Empty;
    public string? TargetType { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
}

public class UpdatePromotionBannerRequest : CreatePromotionBannerRequest
{
}
