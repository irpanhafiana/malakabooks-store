namespace MalakaBooks.Entity;

public class PaymentEntity : BaseObject
{
    public string Name { get; set; } = string.Empty;
    public string MethodType { get; set; } = string.Empty;
    public List<PaymentFeeEntity> Fees { get; set; } = [];
}

public class PaymentFeeEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public decimal Value { get; set; }
}
