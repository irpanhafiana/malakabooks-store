using MalakaBooks.ConfigSetting;
using MalakaBooks.IRepository;
using MalakaBooks.Mediator.SimasrimHandlers;
using Mardika.Simasrim.Service.Model;
using MediatR;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace MalakaBooks.API;

/// <summary>
/// Periodically checks shipped orders with AWB numbers and marks them as delivered when the carrier confirms delivery.
/// </summary>
public class ShippedOrderAwbStatusService(
    IServiceScopeFactory serviceScopeFactory,
    IOptions<AppSetting> appSettingOptions,
    TimeProvider timeProvider,
    ILogger<ShippedOrderAwbStatusService> logger) : BackgroundService
{
    private readonly OrderSetting _orderSetting = appSettingOptions.Value.OrderSetting ?? new OrderSetting();

    /// <summary>
    /// Runs the periodic AWB status synchronization loop until the host is shutting down.
    /// </summary>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var checkInterval = TimeSpan.FromMinutes(Math.Max(1, _orderSetting.AwbStatusCheckIntervalMinutes));
        var startupDelay = TimeSpan.FromSeconds(Math.Max(0, _orderSetting.AwbStatusStartupDelaySeconds));

        logger.LogInformation(
            "Shipped order AWB status service started with interval {CheckInterval} and startup delay {StartupDelay}.",
            checkInterval,
            startupDelay);

        if (startupDelay > TimeSpan.Zero)
        {
            await Task.Delay(startupDelay, stoppingToken);
        }

        using var timer = new PeriodicTimer(checkInterval, timeProvider);

        try
        {
            await SynchronizeDeliveredOrdersAsync(stoppingToken);

            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                await SynchronizeDeliveredOrdersAsync(stoppingToken);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            logger.LogInformation("Shipped order AWB status service is stopping.");
        }
    }

    private async Task SynchronizeDeliveredOrdersAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = serviceScopeFactory.CreateScope();
            var orderRepository = scope.ServiceProvider.GetRequiredService<IOrderRepository>();
            var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
            var utcNow = timeProvider.GetUtcNow().UtcDateTime;

            var shippedOrders = await orderRepository.GetShippedOrdersWithAwbAsync(cancellationToken);
            var deliveredCount = 0;

            foreach (var order in shippedOrders)
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (string.IsNullOrWhiteSpace(order.AWBNo) || string.IsNullOrWhiteSpace(order.ShippingCourier))
                {
                    continue;
                }

                var response = await mediator.Send(
                    new GetSimasrimDetailResiQuery(new DetailResiModel
                    {
                        Ekspedisi = order.ShippingCourier,
                        Awb = order.AWBNo
                    }),
                    cancellationToken);

                if (!string.Equals(response?.Status, "Success", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                var shipmentStatus = response?.Data?.Status;
                if (!string.Equals(shipmentStatus, "delivered", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                var wasUpdated = await orderRepository.MarkAsDeliveredAsync(order.Id!, utcNow, cancellationToken);
                if (wasUpdated)
                {
                    deliveredCount++;
                }
            }

            if (deliveredCount > 0)
            {
                logger.LogInformation("Marked {DeliveredCount} shipped order(s) as delivered after AWB sync.", deliveredCount);
            }
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to synchronize shipped order AWB statuses.");
        }
    }
}
