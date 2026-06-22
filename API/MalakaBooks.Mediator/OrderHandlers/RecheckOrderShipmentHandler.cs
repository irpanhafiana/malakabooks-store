using MalakaBooks.IRepository;
using MalakaBooks.ViewModel;
using MediatR;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Linq;

namespace MalakaBooks.Mediator.OrderHandlers;

using AppSetting = ConfigSetting.AppSetting;

public class RecheckOrderShipmentHandler(
    IOrderRepository orderRepository,
    SimasrimApiClient simasrimApiClient,
    IOptions<AppSetting> appOptions)
    : IRequestHandler<RecheckOrderShipmentCommand, RecheckOrderShipmentResponse>
{
    private readonly AppSetting appSetting = appOptions.Value;

    public async Task<RecheckOrderShipmentResponse> Handle(RecheckOrderShipmentCommand request, CancellationToken cancellationToken)
    {
        var orderId = request.OrderId?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(orderId))
        {
            return new RecheckOrderShipmentResponse
            {
                OrderId = string.Empty,
                IsSuccess = false,
                Message = "OrderId is required."
            };
        }

        var order = await orderRepository.GetByIdAsync(orderId, cancellationToken);
        if (order is null)
        {
            return new RecheckOrderShipmentResponse
            {
                OrderId = orderId,
                IsSuccess = false,
                Message = "Order not found."
            };
        }

        if (!string.Equals(order.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase))
        {
            return new RecheckOrderShipmentResponse
            {
                OrderId = orderId,
                IsSuccess = false,
                Message = "Order payment has not been confirmed."
            };
        }

        if (!string.IsNullOrWhiteSpace(order.AWBNo))
        {
            if (!string.Equals(order.Status, OrderStatuses.Shipped, StringComparison.OrdinalIgnoreCase))
            {
                order.Status = OrderStatuses.Shipped;
                order.UpdatedAt = DateTime.UtcNow;
                await orderRepository.UpdateAsync(order.Id!, order, cancellationToken);
            }

            return new RecheckOrderShipmentResponse
            {
                OrderId = orderId,
                IsSuccess = true,
                AlreadySynchronized = true,
                Message = "Shipment already synchronized locally.",
                AwbNo = order.AWBNo,
                ShipmentLastError = order.ShipmentLastError,
                ShipmentCreatedAt = order.ShipmentCreatedAt,
                ShipmentLastAttemptAt = order.ShipmentLastAttemptAt
            };
        }

        order.ShipmentLastAttemptAt = DateTime.UtcNow;
        order.UpdatedAt = DateTime.UtcNow;

        if (string.IsNullOrWhiteSpace(order.ShipmentDetailJson))
        {
            order.ShipmentLastError = "Shipment detail is not available for this order.";
            await orderRepository.UpdateAsync(order.Id!, order, cancellationToken);

            return new RecheckOrderShipmentResponse
            {
                OrderId = orderId,
                IsSuccess = false,
                RequiresManualReview = true,
                Message = order.ShipmentLastError,
                ShipmentLastError = order.ShipmentLastError,
                ShipmentLastAttemptAt = order.ShipmentLastAttemptAt
            };
        }

        var recheckPath = appSetting.OrderSetting?.SimasrimRecheckPath?.Trim() ?? string.Empty;
        if (!string.IsNullOrWhiteSpace(recheckPath))
        {
            try
            {
                var remoteResponse = await QuerySimasrimAsync(recheckPath, orderId, order.AWBNo, cancellationToken);
                var recoveredAwb = ExtractAwb(remoteResponse);

                if (!string.IsNullOrWhiteSpace(recoveredAwb))
                {
                    order.AWBNo = recoveredAwb;
                    order.Status = OrderStatuses.Shipped;
                    order.ShipmentCreatedAt ??= DateTime.UtcNow;
                    order.ShipmentLastError = string.Empty;
                    await orderRepository.UpdateAsync(order.Id!, order, cancellationToken);

                    return new RecheckOrderShipmentResponse
                    {
                        OrderId = orderId,
                        IsSuccess = true,
                        AlreadySynchronized = true,
                        Message = "Shipment synchronized from Simasrim recheck.",
                        AwbNo = order.AWBNo,
                        ShipmentLastError = order.ShipmentLastError,
                        ShipmentCreatedAt = order.ShipmentCreatedAt,
                        ShipmentLastAttemptAt = order.ShipmentLastAttemptAt
                    };
                }

                order.ShipmentLastError = "Simasrim recheck completed but did not return an AWB number.";
                await orderRepository.UpdateAsync(order.Id!, order, cancellationToken);

                return new RecheckOrderShipmentResponse
                {
                    OrderId = orderId,
                    IsSuccess = false,
                    RequiresManualReview = true,
                    Message = order.ShipmentLastError,
                    ShipmentLastError = order.ShipmentLastError,
                    ShipmentCreatedAt = order.ShipmentCreatedAt,
                    ShipmentLastAttemptAt = order.ShipmentLastAttemptAt
                };
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                order.ShipmentLastError = $"Simasrim recheck failed: {ex.Message}";
                await orderRepository.UpdateAsync(order.Id!, order, cancellationToken);

                return new RecheckOrderShipmentResponse
                {
                    OrderId = orderId,
                    IsSuccess = false,
                    RequiresManualReview = true,
                    Message = order.ShipmentLastError,
                    ShipmentLastError = order.ShipmentLastError,
                    ShipmentCreatedAt = order.ShipmentCreatedAt,
                    ShipmentLastAttemptAt = order.ShipmentLastAttemptAt
                };
            }
        }

        order.ShipmentLastError = string.IsNullOrWhiteSpace(order.ShipmentLastError)
            ? "Simasrim recheck path is not configured yet. Review the last shipment attempt and retry create shipment if needed."
            : $"{order.ShipmentLastError} Recheck could not call Simasrim because no recheck path is configured.";

        await orderRepository.UpdateAsync(order.Id!, order, cancellationToken);

        return new RecheckOrderShipmentResponse
        {
            OrderId = orderId,
            IsSuccess = false,
            RequiresManualReview = true,
            Message = order.ShipmentLastError,
            ShipmentLastError = order.ShipmentLastError,
            ShipmentCreatedAt = order.ShipmentCreatedAt,
            ShipmentLastAttemptAt = order.ShipmentLastAttemptAt
        };
    }

    private async Task<JObject?> QuerySimasrimAsync(string configuredPath, string orderId, string? awbNo, CancellationToken cancellationToken)
    {
        var resolvedPath = configuredPath
            .Replace("{orderId}", Uri.EscapeDataString(orderId), StringComparison.OrdinalIgnoreCase)
            .Replace("{awb}", Uri.EscapeDataString(awbNo ?? string.Empty), StringComparison.OrdinalIgnoreCase);

        var method = appSetting.OrderSetting?.SimasrimRecheckMethod?.Trim() ?? "GET";
        if (string.Equals(method, "POST", StringComparison.OrdinalIgnoreCase))
        {
            return await simasrimApiClient.PostAsync<JObject>(
                resolvedPath,
                new
                {
                    orderId,
                    awb = awbNo ?? string.Empty
                },
                cancellationToken);
        }

        return await simasrimApiClient.GetAsync<JObject>(resolvedPath, cancellationToken);
    }

    private static string ExtractAwb(JObject? response)
    {
        if (response is null)
        {
            return string.Empty;
        }

        return response.SelectToken("data.awb")?.ToString()
            ?? response.SelectToken("data.Awb")?.ToString()
            ?? response.SelectToken("data.resi")?.ToString()
            ?? response.SelectToken("data.no_resi")?.ToString()
            ?? response.SelectToken("awb")?.ToString()
            ?? string.Empty;
    }
}
