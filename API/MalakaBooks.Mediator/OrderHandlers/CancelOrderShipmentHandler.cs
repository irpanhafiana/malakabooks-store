using MalakaBooks.IRepository;
using MalakaBooks.ViewModel;
using Mardika.Simasrim.Service.Model;
using MediatR;
using Microsoft.Extensions.Options;

namespace MalakaBooks.Mediator.OrderHandlers;

using AppSetting = MalakaBooks.ConfigSetting.AppSetting;

public class CancelOrderShipmentHandler(
    IOrderRepository orderRepository,
    SimasrimApiClient simasrimApiClient,
    IOptions<AppSetting> appOptions)
    : IRequestHandler<CancelOrderShipmentCommand, CancelOrderShipmentResponse>
{
    private readonly AppSetting appSetting = appOptions.Value;

    public async Task<CancelOrderShipmentResponse> Handle(CancelOrderShipmentCommand request, CancellationToken cancellationToken)
    {
        var orderId = request.OrderId?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(orderId))
        {
            return new CancelOrderShipmentResponse
            {
                OrderId = string.Empty,
                IsSuccess = false,
                Message = "OrderId is required."
            };
        }

        var order = await orderRepository.GetByIdAsync(orderId, cancellationToken);
        if (order is null)
        {
            return new CancelOrderShipmentResponse
            {
                OrderId = orderId,
                IsSuccess = false,
                Message = "Order not found."
            };
        }

        if (!string.Equals(order.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase))
        {
            return new CancelOrderShipmentResponse
            {
                OrderId = orderId,
                IsSuccess = false,
                Message = "Order payment has not been confirmed."
            };
        }

        if (!string.Equals(order.Status, OrderStatuses.Shipped, StringComparison.OrdinalIgnoreCase))
        {
            return new CancelOrderShipmentResponse
            {
                OrderId = orderId,
                IsSuccess = false,
                Message = $"Order status '{order.Status}' is not eligible for shipment cancellation.",
                AwbNo = order.AWBNo ?? string.Empty,
                ShipmentLastError = order.ShipmentLastError,
                ShipmentCreatedAt = order.ShipmentCreatedAt,
                ShipmentLastAttemptAt = order.ShipmentLastAttemptAt
            };
        }

        var awbNo = order.AWBNo?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(awbNo))
        {
            return new CancelOrderShipmentResponse
            {
                OrderId = orderId,
                IsSuccess = false,
                Message = "Shipment AWB is not available for this order.",
                ShipmentLastError = order.ShipmentLastError,
                ShipmentCreatedAt = order.ShipmentCreatedAt,
                ShipmentLastAttemptAt = order.ShipmentLastAttemptAt
            };
        }

        var ekspedisi = order.ShippingCourier?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(ekspedisi))
        {
            return new CancelOrderShipmentResponse
            {
                OrderId = orderId,
                IsSuccess = false,
                Message = "Shipping courier is not available for this order.",
                AwbNo = awbNo,
                ShipmentLastError = order.ShipmentLastError,
                ShipmentCreatedAt = order.ShipmentCreatedAt,
                ShipmentLastAttemptAt = order.ShipmentLastAttemptAt
            };
        }

        var cancelPath = appSetting.OrderSetting?.SimasrimCancelPath?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(cancelPath))
        {
            return new CancelOrderShipmentResponse
            {
                OrderId = orderId,
                IsSuccess = false,
                RequiresRetry = true,
                Message = "Simasrim cancel shipment path is not configured yet.",
                AwbNo = awbNo,
                ShipmentLastError = order.ShipmentLastError,
                ShipmentCreatedAt = order.ShipmentCreatedAt,
                ShipmentLastAttemptAt = order.ShipmentLastAttemptAt
            };
        }

        try
        {
            order.ShipmentLastAttemptAt = DateTime.UtcNow;

            var remoteResponse = await CancelShipmentAsync(cancelPath, awbNo, ekspedisi, cancellationToken);
            if (!IsCancelSuccessful(remoteResponse))
            {
                order.ShipmentLastError = ExtractErrorMessage(remoteResponse, "Simasrim shipment cancellation failed.");
                order.UpdatedAt = DateTime.UtcNow;
                await orderRepository.UpdateAsync(order.Id!, order, cancellationToken);

                return new CancelOrderShipmentResponse
                {
                    OrderId = orderId,
                    IsSuccess = false,
                    RequiresRetry = true,
                    Message = order.ShipmentLastError,
                    AwbNo = awbNo,
                    ShipmentLastError = order.ShipmentLastError,
                    ShipmentCreatedAt = order.ShipmentCreatedAt,
                    ShipmentLastAttemptAt = order.ShipmentLastAttemptAt
                };
            }

            order.Status = OrderStatuses.ReadyToShip;
            order.AWBNo = null;
            order.ShipmentLastError = string.Empty;
            order.UpdatedAt = DateTime.UtcNow;
            await orderRepository.UpdateAsync(order.Id!, order, cancellationToken);

            return new CancelOrderShipmentResponse
            {
                OrderId = orderId,
                IsSuccess = true,
                ShipmentCancelled = true,
                Message = "Shipment cancelled successfully.",
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
            order.ShipmentLastAttemptAt = DateTime.UtcNow;
            order.ShipmentLastError = $"Simasrim shipment cancellation failed: {ex.Message}";
            order.UpdatedAt = DateTime.UtcNow;
            await orderRepository.UpdateAsync(order.Id!, order, cancellationToken);

            return new CancelOrderShipmentResponse
            {
                OrderId = orderId,
                IsSuccess = false,
                RequiresRetry = true,
                Message = order.ShipmentLastError,
                AwbNo = awbNo,
                ShipmentLastError = order.ShipmentLastError,
                ShipmentCreatedAt = order.ShipmentCreatedAt,
                ShipmentLastAttemptAt = order.ShipmentLastAttemptAt
            };
        }
    }

    private async Task<CancelResiResponse?> CancelShipmentAsync(string configuredPath, string courier, string awbNo, CancellationToken cancellationToken)
    {
        var resolvedPath = configuredPath
            .Replace("{ekspedisi}", Uri.EscapeDataString(courier), StringComparison.OrdinalIgnoreCase)
            .Replace("{awb}", Uri.EscapeDataString(awbNo), StringComparison.OrdinalIgnoreCase);

        var payload = new
        {
            ekspedisi = courier,
            awb = awbNo,
        };

        var method = appSetting.OrderSetting?.SimasrimCancelMethod?.Trim() ?? "POST";
        if (string.Equals(method, "PUT", StringComparison.OrdinalIgnoreCase))
        {
            return await simasrimApiClient.PutAsync<CancelResiResponse>(resolvedPath, payload, cancellationToken);
        }

        return await simasrimApiClient.PostAsync<CancelResiResponse>(resolvedPath, payload, cancellationToken);
    }

    private static bool IsCancelSuccessful(CancelResiResponse? response)
    {
        if (response is null)
        {
            return false;
        }

        return string.Equals(response.Status, "SUCCESS", StringComparison.OrdinalIgnoreCase)
            && string.Equals(response.Code, "001", StringComparison.OrdinalIgnoreCase);
    }

    private static string ExtractErrorMessage(CancelResiResponse? response, string defaultMessage)
    {
        if (response is null)
        {
            return defaultMessage;
        }

        return response.Data?.Description
            ?? defaultMessage;
    }
}
