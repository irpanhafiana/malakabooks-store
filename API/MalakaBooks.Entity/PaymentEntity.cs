namespace MalakaBooks.Entity;

public class PaymentEntity : BaseObject
{
    public string Name { get; set; } = string.Empty;
    public string MethodType { get; set; } = string.Empty;
    public decimal AdditionalFeePercentage { get; set; }
    public decimal AdditionalFeeAmount { get; set; }
}
