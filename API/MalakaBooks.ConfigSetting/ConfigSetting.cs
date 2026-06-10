namespace MalakaBooks.ConfigSetting
{
  public record AppSetting
  {
    public Dictionary<string, int>? IdempotentExpiredHours { get; set; }
    public ImageSetting? ImageSetting { get; set; }
    public RateLimiterSetting? RateLimiterSetting { get; set; }
  }

  public class RateLimiterSetting
  {
    public int Limit { get; set; }
    public int ResetMinute { get; set; }
    public int QueueLimit { get; set; }
    public bool AutoReplenish { get; set; }
  }

  public class ImageSetting
  {
    public string[]? AllowedExtensions { get; set; }
    public int MaximumFileSize { get; set; }
  }

  public class IS4APISettings
  {
    public string? AuthorityId { get; set; }
    public string? BaseUrl { get; set; }
    public string? UserId { get; set; }
    public string? UserPassword { get; set; }
    public string? ClientId { get; set; }
    public string? ClientSecret { get; set; }
    public string? Scopes { get; set; }
  }

}
