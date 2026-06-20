using MalakaBooks.IRepository;
using Microsoft.Extensions.Hosting;

namespace MalakaBooks.API;

/// <summary>
/// Periodically expires unpaid orders whose payment windows have elapsed.
/// </summary>
public class UnpaidOrderExpirationService(
    IServiceScopeFactory serviceScopeFactory,
    ILogger<UnpaidOrderExpirationService> logger) : BackgroundService
{
    private static readonly TimeSpan CheckInterval = TimeSpan.FromMinutes(1);

    /// <summary>
    /// Runs the periodic expiration loop until the host is shutting down.
    /// </summary>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = serviceScopeFactory.CreateScope();
                var orderRepository = scope.ServiceProvider.GetRequiredService<IOrderRepository>();
                var expiredCount = await orderRepository.ExpireUnpaidOrdersAsync(DateTime.UtcNow, stoppingToken);

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

            await Task.Delay(CheckInterval, stoppingToken);
        }
    }
}
