using MalakaBooks.IRepository;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.OrderHandlers;

public class ProcessSimasrimShipmentWebhookHandler(IOrderRepository orderRepository)
    : IRequestHandler<ProcessSimasrimShipmentWebhookCommand, ProcessSimasrimShipmentWebhookResult>
{
    public async Task<ProcessSimasrimShipmentWebhookResult> Handle(ProcessSimasrimShipmentWebhookCommand request, CancellationToken cancellationToken)
    {
        var referenceNo = request.Request.Data?.TransactionCode?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(referenceNo))
        {
            return new ProcessSimasrimShipmentWebhookResult
            {
                IsSuccess = false,
                Message = "TransactionCode is required."
            };
        }

        var order = await orderRepository.GetByIdAsync(referenceNo, cancellationToken)
            ?? await orderRepository.GetByShipmentReferenceAsync(referenceNo, cancellationToken);

        if (order is null)
        {
            return new ProcessSimasrimShipmentWebhookResult
            {
                OrderId = referenceNo,
                IsSuccess = false,
                Message = "Order not found."
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

            return new ProcessSimasrimShipmentWebhookResult
            {
                OrderId = order.Id ?? string.Empty,
                IsSuccess = true,
                AlreadyProcessed = true,
                ShipmentCreated = false,
                Message = "Shipment already processed.",
                AwbNo = order.AWBNo
            };
        }

        order.ShipmentLastAttemptAt = DateTime.UtcNow;
        order.UpdatedAt = DateTime.UtcNow;

        var awb = request.Request.Data?.Awb?.Trim() ?? string.Empty;
        if (!string.Equals(request.Request.Status, "SUCCESS", StringComparison.OrdinalIgnoreCase) || string.IsNullOrWhiteSpace(awb))
        {
            order.ShipmentLastError = string.IsNullOrWhiteSpace(request.Request.Status)
                ? "Simasrim shipment creation failed."
                : $"Simasrim shipment creation returned status '{request.Request.Status}'.";
            await orderRepository.UpdateAsync(order.Id!, order, cancellationToken);

            return new ProcessSimasrimShipmentWebhookResult
            {
                OrderId = order.Id ?? string.Empty,
                IsSuccess = false,
                RequiresRetry = true,
                Message = order.ShipmentLastError,
                AwbNo = string.Empty
            };
        }

        order.AWBNo = awb;
        order.ShipmentLastError = string.Empty;
        order.ShipmentCreatedAt ??= DateTime.UtcNow;
        order.Status = OrderStatuses.Shipped;
        order.UpdatedAt = DateTime.UtcNow;

        await orderRepository.UpdateAsync(order.Id!, order, cancellationToken);

        return new ProcessSimasrimShipmentWebhookResult
        {
            OrderId = order.Id ?? string.Empty,
            IsSuccess = true,
            ShipmentCreated = true,
            Message = "Shipment created successfully.",
            AwbNo = order.AWBNo
        };
    }
}
