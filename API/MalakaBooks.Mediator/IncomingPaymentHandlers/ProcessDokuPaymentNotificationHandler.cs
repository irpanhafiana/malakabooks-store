using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.IncomingPaymentHandlers;

public class ProcessDokuPaymentNotificationHandler(
    IOrderRepository orderRepository,
    IIncomingPaymentRepository incomingPaymentRepository,
    IBookRepository bookRepository,
    IInventoryMovementRepository inventoryMovementRepository)
    : IRequestHandler<ProcessDokuPaymentNotificationCommand, ProcessDokuPaymentResult>
{
    public async Task<ProcessDokuPaymentResult> Handle(ProcessDokuPaymentNotificationCommand request, CancellationToken cancellationToken)
    {
        var orderId = request.Request.OrderId?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(orderId))
        {
            return new ProcessDokuPaymentResult
            {
                OrderId = string.Empty,
                IsSuccess = false,
                Message = "OrderId is required."
            };
        }

        var order = await orderRepository.GetByIdAsync(orderId, cancellationToken);
        if (order is null)
        {
            return new ProcessDokuPaymentResult
            {
                OrderId = orderId,
                IsSuccess = false,
                Message = "Order not found."
            };
        }

        var normalizedStatus = NormalizeStatus(request.Request.TransactionStatus);
        if (!string.Equals(normalizedStatus, "paid", StringComparison.OrdinalIgnoreCase))
        {
            return new ProcessDokuPaymentResult
            {
                OrderId = orderId,
                IsSuccess = false,
                Message = $"DOKU status '{request.Request.TransactionStatus}' is not a paid status."
            };
        }

        if (order.ExpiresAt.HasValue && order.ExpiresAt.Value <= DateTime.UtcNow &&
            !string.Equals(order.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase))
        {
            order.Status = "expired";
            order.PaymentStatus = "expired";
            order.UpdatedAt = DateTime.UtcNow;

            await orderRepository.UpdateAsync(order.Id!, order, cancellationToken);

            return new ProcessDokuPaymentResult
            {
                OrderId = orderId,
                IsSuccess = false,
                Message = "Order payment has expired."
            };
        }

        var existingIncomingPayment = await incomingPaymentRepository.GetByOrderIdAsync(orderId, cancellationToken);
        if (existingIncomingPayment is not null)
        {
            if (!string.Equals(order.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase))
            {
                order.Status = "ready_to_ship";
                order.PaymentStatus = "paid";
                order.ExpiresAt = null;
                order.PaymentMethod = existingIncomingPayment.PaymentMethod;
                order.PaymentGateway = existingIncomingPayment.Gateway;
                order.IncomingPaymentId = existingIncomingPayment.Id ?? string.Empty;
                order.PaidAt = existingIncomingPayment.PaidAt;
                order.UpdatedAt = DateTime.UtcNow;

                await DeductStockAsync(order, cancellationToken);
                await orderRepository.UpdateAsync(order.Id!, order, cancellationToken);
            }

            return new ProcessDokuPaymentResult
            {
                OrderId = orderId,
                IsSuccess = true,
                AlreadyProcessed = true,
                IncomingPaymentCreated = false,
                IncomingPaymentId = existingIncomingPayment.Id ?? string.Empty,
                Message = "Payment already processed."
            };
        }

        var paidAt = request.Request.PaidAt ?? DateTime.UtcNow;
        var amount = request.Request.Amount > 0 ? request.Request.Amount : order.TotalPrice;
        var paymentMethod = string.IsNullOrWhiteSpace(request.Request.PaymentMethod) ? "QRIS" : request.Request.PaymentMethod.Trim();

        var incomingPayment = new IncomingPaymentEntity
        {
            OrderId = orderId,
            UserId = order.User.UserId,
            Gateway = "DOKU",
            PaymentMethod = paymentMethod,
            Status = "paid",
            Amount = amount,
            Currency = string.IsNullOrWhiteSpace(request.Request.Currency) ? "IDR" : request.Request.Currency.Trim(),
            ReferenceNo = orderId,
            GatewayReference = request.Request.GatewayReference?.Trim() ?? string.Empty,
            GatewayInvoiceNumber = request.Request.GatewayInvoiceNumber?.Trim() ?? string.Empty,
            RawNotification = request.Request.RawPayload?.Trim() ?? string.Empty,
            PaidAt = paidAt,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Details =
            [
                new IncomingPaymentDetailEntity
                {
                    OrderId = orderId,
                    Amount = amount,
                    Note = $"Auto created from DOKU notification for order '{orderId}'."
                }
            ]
        };

        incomingPayment = await incomingPaymentRepository.CreateAsync(incomingPayment, cancellationToken);

        order.Status = "ready_to_ship";
        order.PaymentStatus = "paid";
        order.ExpiresAt = null;
        order.PaymentMethod = paymentMethod;
        order.PaymentGateway = "DOKU";
        order.IncomingPaymentId = incomingPayment.Id ?? string.Empty;
        order.PaidAt = paidAt;
        order.UpdatedAt = DateTime.UtcNow;

        await DeductStockAsync(order, cancellationToken);
        await orderRepository.UpdateAsync(order.Id!, order, cancellationToken);

        return new ProcessDokuPaymentResult
        {
            OrderId = orderId,
            IsSuccess = true,
            AlreadyProcessed = false,
            IncomingPaymentCreated = true,
            IncomingPaymentId = incomingPayment.Id ?? string.Empty,
            Message = "Payment processed successfully."
        };
    }

    private static string NormalizeStatus(string? status) =>
        status?.Trim().ToLowerInvariant() switch
        {
            "success" => "paid",
            "paid" => "paid",
            "settlement" => "paid",
            "completed" => "paid",
            _ => status?.Trim().ToLowerInvariant() ?? string.Empty
        };

    private async Task DeductStockAsync(OrderEntity order, CancellationToken cancellationToken)
    {
        foreach (var item in order.Items.Where(item => !string.IsNullOrWhiteSpace(item.BookId) && item.Quantity > 0))
        {
            var currentBook = await bookRepository.GetByIdAsync(item.BookId, cancellationToken);
            if (currentBook is null)
            {
                continue;
            }

            var stockBefore = currentBook.Stock;
            var updatedBook = await bookRepository.AdjustStockAsync(item.BookId, -item.Quantity, cancellationToken);
            if (updatedBook is null)
            {
                continue;
            }

            await inventoryMovementRepository.CreateAsync(new InventoryMovementEntity
            {
                BookId = item.BookId,
                BookTitle = string.IsNullOrWhiteSpace(currentBook.Title) ? item.Title : currentBook.Title,
                MovementType = "sale",
                QuantityDelta = -item.Quantity,
                StockBefore = stockBefore,
                StockAfter = updatedBook.Stock,
                ReferenceId = order.Id ?? string.Empty,
                Note = $"Stock deducted after payment confirmation for order '{order.Id}'.",
                CreatedAt = DateTime.UtcNow
            }, cancellationToken);
        }
    }
}
