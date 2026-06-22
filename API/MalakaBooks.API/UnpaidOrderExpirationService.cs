using MalakaBooks.IRepository;
using MalakaBooks.ConfigSetting;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace MalakaBooks.API;

/// <summary>
/// Periodically expires unpaid orders whose payment windows have elapsed.
/// </summary>
public class UnpaidOrderExpirationService(
    IServiceScopeFactory serviceScopeFactory,
    IOptions<AppSetting> appSettingOptions,
    TimeProvider timeProvider,
    ILogger<UnpaidOrderExpirationService> logger) : BackgroundService
{
    private readonly OrderSetting _orderSetting = appSettingOptions.Value.OrderSetting ?? new OrderSetting();

    /// <summary>
    /// Runs the periodic expiration loop until the host is shutting down.
    /// </summary>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var checkInterval = TimeSpan.FromMinutes(Math.Max(1, _orderSetting.ExpirationCheckIntervalMinutes));
        var startupDelay = TimeSpan.FromSeconds(Math.Max(0, _orderSetting.ExpirationStartupDelaySeconds));

        logger.LogInformation(
            "Unpaid order expiration service started with interval {CheckInterval} and startup delay {StartupDelay}.",
            checkInterval,
            startupDelay);

        if (startupDelay > TimeSpan.Zero)
        {
            await Task.Delay(startupDelay, stoppingToken);
        }

        using var timer = new PeriodicTimer(checkInterval, timeProvider);

        try
        {
            await ExpireUnpaidOrdersAsync(stoppingToken);

            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                await ExpireUnpaidOrdersAsync(stoppingToken);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            logger.LogInformation("Unpaid order expiration service is stopping.");
        }
    }

    private async Task ExpireUnpaidOrdersAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = serviceScopeFactory.CreateScope();
            var orderRepository = scope.ServiceProvider.GetRequiredService<IOrderRepository>();
            var expiredCount = await orderRepository.ExpireUnpaidOrdersAsync(timeProvider.GetUtcNow().UtcDateTime, cancellationToken);

            if (expiredCount > 0)
            {
                logger.LogInformation("Expired {ExpiredCount} unpaid order(s).", expiredCount);
            }
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to expire unpaid orders.");
        }
    }
}
