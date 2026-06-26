namespace MalakaBooks.ViewModel;

public class PaymentResponse
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string MethodType { get; set; } = string.Empty;
    public List<PaymentFeeResponse> Fees { get; set; } = [];
    public string Alias { get; set; } = string.Empty;
}

public class CreatePaymentRequest
{
    public string Name { get; set; } = string.Empty;
    public string MethodType { get; set; } = string.Empty;
    public List<PaymentFeeRequest> Fees { get; set; } = [];
}

public class UpdatePaymentRequest : CreatePaymentRequest
{
}

public class PaymentFeeRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public decimal Value { get; set; }
}

public class PaymentFeeResponse : PaymentFeeRequest
{
}

public class CalculatePaymentFeeRequest
{
    public string PaymentId { get; set; } = string.Empty;
    public decimal ItemsSubtotal { get; set; }
}

public class CalculatedPaymentFeeResponse
{
    public string PaymentId { get; set; } = string.Empty;
    public string PaymentName { get; set; } = string.Empty;
    public string MethodType { get; set; } = string.Empty;
    public decimal ItemsSubtotal { get; set; }
    public decimal TotalFeeAmount { get; set; }
    public List<CalculatedPaymentFeeItemResponse> Fees { get; set; } = [];
}

public class CalculatedPaymentFeeItemResponse
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public decimal Amount { get; set; }
}
