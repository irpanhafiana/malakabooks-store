using MalakaBooks.IRepository;
using MalakaBooks.Mediator.Common;
using MalakaBooks.ViewModel;
using Mardika.Simasrim.Service.Model;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

public class CreateOrderShipmentHandler(
    IOrderRepository orderRepository,
    SimasrimApiClient simasrimApiClient)
    : IRequestHandler<CreateOrderShipmentCommand, CreateOrderShipmentResponse>
{
    public async Task<CreateOrderShipmentResponse> Handle(CreateOrderShipmentCommand request, CancellationToken cancellationToken)
    {
        var orderId = request.OrderId?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(orderId))
        {
            return new CreateOrderShipmentResponse
            {
                OrderId = string.Empty,
                IsSuccess = false,
                Message = "OrderId is required."
            };
        }

        var order = await orderRepository.GetByIdAsync(orderId, cancellationToken);
        if (order is null)
        {
            return new CreateOrderShipmentResponse
            {
                OrderId = orderId,
                IsSuccess = false,
                Message = "Order not found."
            };
        }

        if (!string.Equals(order.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase))
        {
            return new CreateOrderShipmentResponse
            {
                OrderId = orderId,
                IsSuccess = false,
                Message = "Order payment has not been confirmed."
            };
        }

        if (!string.Equals(order.Status, "ready_to_ship", StringComparison.OrdinalIgnoreCase))
        {
            return new CreateOrderShipmentResponse
            {
                OrderId = orderId,
                IsSuccess = false,
                Message = $"Order status '{order.Status}' is not eligible for shipment creation."
            };
        }

        var shipmentDetail = order.ShipmentDetailJson.ToShipmentDetail();

        if (shipmentDetail is null)
        {
            return new CreateOrderShipmentResponse
            {
                OrderId = orderId,
                IsSuccess = false,
                Message = "Shipment detail is not available for this order."
            };
        }

        if (!string.IsNullOrWhiteSpace(order.AWBNo))
        {
            return new CreateOrderShipmentResponse
            {
                OrderId = orderId,
                IsSuccess = true,
                AlreadyProcessed = true,
                ShipmentCreated = false,
                ShipmentRetryCount = order.ShipmentRetryCount,
                Message = "Shipment already processed.",
                AwbNo = order.AWBNo,
                ShipmentLastError = order.ShipmentLastError,
                ShipmentCreatedAt = order.ShipmentCreatedAt,
                ShipmentLastAttemptAt = order.ShipmentLastAttemptAt
            };
        }

        try
        {
            order.ShipmentLastAttemptAt = DateTime.UtcNow;
            order.ShipmentRetryCount++;

            var simasrimResponse = await simasrimApiClient.PostAsync<CreateResiResponse>(
                "api/b2b/pengiriman/ekspedisi/cetak-resi",
                shipmentDetail.ToSimasrimRequest(),
                cancellationToken);

            if (simasrimResponse is null)
            {
                order.ShipmentLastError = "No response returned from Simasrim.";
                order.UpdatedAt = DateTime.UtcNow;
                await orderRepository.UpdateAsync(order.Id!, order, cancellationToken);

                return new CreateOrderShipmentResponse
                {
                    OrderId = orderId,
                    IsSuccess = false,
                    RequiresRetry = true,
                    ShipmentRetryCount = order.ShipmentRetryCount,
                    Message = order.ShipmentLastError,
                    ShipmentLastError = order.ShipmentLastError,
                    ShipmentLastAttemptAt = order.ShipmentLastAttemptAt
                };
            }

            if (!string.Equals(simasrimResponse.Status, "SUCCESS", StringComparison.OrdinalIgnoreCase) ||
                string.IsNullOrWhiteSpace(simasrimResponse.Data?.Awb))
            {
                order.ShipmentLastError = string.IsNullOrWhiteSpace(simasrimResponse.Status)
                    ? "Simasrim shipment creation failed."
                    : $"Simasrim shipment creation returned status '{simasrimResponse.Status}'.";
                order.UpdatedAt = DateTime.UtcNow;
                await orderRepository.UpdateAsync(order.Id!, order, cancellationToken);

                return new CreateOrderShipmentResponse
                {
                    OrderId = orderId,
                    IsSuccess = false,
                    RequiresRetry = true,
                    ShipmentRetryCount = order.ShipmentRetryCount,
                    Message = order.ShipmentLastError,
                    ShipmentLastError = order.ShipmentLastError,
                    ShipmentLastAttemptAt = order.ShipmentLastAttemptAt
                };
            }

            order.AWBNo = simasrimResponse.Data.Awb;
            order.ShipmentLastError = string.Empty;
            order.ShipmentCreatedAt = DateTime.UtcNow;
            order.Status = "shipped";
            order.UpdatedAt = DateTime.UtcNow;

            await orderRepository.UpdateAsync(order.Id!, order, cancellationToken);

            return new CreateOrderShipmentResponse
            {
                OrderId = orderId,
                IsSuccess = true,
                ShipmentCreated = true,
                ShipmentRetryCount = order.ShipmentRetryCount,
                Message = "Shipment created successfully.",
                AwbNo = order.AWBNo,
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
            order.ShipmentLastAttemptAt = DateTime.UtcNow;
            order.ShipmentRetryCount++;
            order.ShipmentLastError = $"Simasrim shipment creation failed: {ex.Message}";
            order.UpdatedAt = DateTime.UtcNow;
            await orderRepository.UpdateAsync(order.Id!, order, cancellationToken);

            return new CreateOrderShipmentResponse
            {
                OrderId = orderId,
                IsSuccess = false,
                RequiresRetry = true,
                ShipmentRetryCount = order.ShipmentRetryCount,
                Message = order.ShipmentLastError,
                ShipmentLastError = order.ShipmentLastError,
                ShipmentLastAttemptAt = order.ShipmentLastAttemptAt
            };
        }
    }
}
