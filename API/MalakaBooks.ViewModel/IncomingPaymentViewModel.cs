namespace MalakaBooks.ViewModel;

public class IncomingPaymentDetailResponse
{
    public string OrderId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Note { get; set; } = string.Empty;
}

public class IncomingPaymentResponse
{
    public string Id { get; set; } = string.Empty;
    public string OrderId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Gateway { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string ReferenceNo { get; set; } = string.Empty;
    public string GatewayReference { get; set; } = string.Empty;
    public string GatewayInvoiceNumber { get; set; } = string.Empty;
    public DateTime PaidAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<IncomingPaymentDetailResponse> Details { get; set; } = [];
}

public class DokuPaymentNotificationRequest
{
    public string OrderId { get; set; } = string.Empty;
    public string TransactionStatus { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = "QRIS";
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "IDR";
    public string GatewayReference { get; set; } = string.Empty;
    public string GatewayInvoiceNumber { get; set; } = string.Empty;
    public DateTime? PaidAt { get; set; }
    public string RawPayload { get; set; } = string.Empty;
}

public class CheckDokuPaymentStatusRequest
{
    public string OrderId { get; set; } = string.Empty;
}

public class DokuCheckPaymentStatusRequest
{
    public string OrderId { get; set; } = string.Empty;
}

public class DokuCheckPaymentStatusResponse
{
    public string OrderId { get; set; } = string.Empty;
    public string TransactionStatus { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = "QRIS";
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "IDR";
    public string GatewayReference { get; set; } = string.Empty;
    public string GatewayInvoiceNumber { get; set; } = string.Empty;
    public DateTime? PaidAt { get; set; }
    public string RawPayload { get; set; } = string.Empty;
}

public class ProcessDokuPaymentResult
{
    public string OrderId { get; set; } = string.Empty;
    public bool IsSuccess { get; set; }
    public bool AlreadyProcessed { get; set; }
    public bool IncomingPaymentCreated { get; set; }
    public string IncomingPaymentId { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
