namespace MalakaBooks.ConfigSetting
{
    public record AppSetting
    {
        public Dictionary<string, int>? IdempotentExpiredHours { get; set; }
        public ImageSetting? ImageSetting { get; set; }
        public RateLimiterSetting? RateLimiterSetting { get; set; }
        public OrderSetting? OrderSetting { get; set; }
        //public SimasrimSetting? SimasrimSetting { get; set; }
    }

    public class SimasrimSetting
    {
        public string? BaseUrl { get; set; }
        public string? ClientId { get; set; }
        public string? ClientSecret { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }
        public string? PartnerName { get; set; }
        //public string[] Scope { get; set; }

        public required string[] Courier { get; set; }
    }


    //public class SimasrimSetting
    //{
    //  public string BaseUrl { get; set; } = string.Empty;
    //  public string ClientId { get; set; } = string.Empty;
    //  public string ClientSecret { get; set; } = string.Empty;
    //  public string Email { get; set; } = string.Empty;
    //  public string Password { get; set; } = string.Empty;
    //  //public string[] Scope { get; set; }

    //  public string[] Courier { get; set; } = [];
    //}

    public class RateLimiterSetting
    {
        public int Limit { get; set; }
        public int ResetMinute { get; set; }
        public int QueueLimit { get; set; }
        public bool AutoReplenish { get; set; }
    }

    public class OrderSetting
    {
        public int ExpirationTimeoutMinutes { get; set; } = 60;
        public int ExpirationCheckIntervalMinutes { get; set; } = 1;
        public int ExpirationStartupDelaySeconds { get; set; }
        public int AwbStatusCheckIntervalMinutes { get; set; } = 60;
        public int AwbStatusStartupDelaySeconds { get; set; }
        public string SimasrimRecheckPath { get; set; } = string.Empty;
        public string SimasrimRecheckMethod { get; set; } = "GET";
        public string SimasrimCancelPath { get; set; } = string.Empty;
        public string SimasrimCancelMethod { get; set; } = "POST";
        public string SimasrimDetailResiPath { get; set; } = string.Empty;
        public string SimasrimDetailResiMethod { get; set; } = "POST";
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

    public class DokuSetting
    {
        public string BaseUrl { get; set; } = string.Empty;
        public string CheckPaymentStatusPath { get; set; } = string.Empty;

        public string PaymentUrl { get; set; } = string.Empty;
        public string PaymentCallbackUrl { get; set; } = string.Empty;
        public string PaymentNotificationUrl { get; set; } = string.Empty;
        public string ClientId { get; set; } = string.Empty;
        public string SecretKey { get; set; } = string.Empty;

        public string RequestPath { get; set; } = string.Empty;
        public string InternalPath { get; set; } = string.Empty;
    }
}
