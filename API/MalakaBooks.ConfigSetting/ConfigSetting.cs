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

}
