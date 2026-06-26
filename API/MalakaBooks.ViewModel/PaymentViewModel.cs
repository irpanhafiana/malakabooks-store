namespace MalakaBooks.ViewModel;

public class PaymentResponse
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string MethodType { get; set; } = string.Empty;
    public decimal AdditionalFeePercentage { get; set; }
    public decimal AdditionalFeeAmount { get; set; }
    public string Alias { get; set; } = string.Empty;
}

public class CreatePaymentRequest
{
    public string Name { get; set; } = string.Empty;
    public string MethodType { get; set; } = string.Empty;
    public decimal AdditionalFeePercentage { get; set; }
    public decimal AdditionalFeeAmount { get; set; }
}

public class UpdatePaymentRequest : CreatePaymentRequest
{
}
