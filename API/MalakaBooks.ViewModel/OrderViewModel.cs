namespace MalakaBooks.ViewModel;

public class OrderItemResponse
{
    public string BookId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
}

public class OrderResponse
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public List<OrderItemResponse> Items { get; set; } = [];
    public string AddressId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string PaymentGateway { get; set; } = string.Empty;
    public string PaymentUrl { get; set; } = string.Empty;
    public string IncomingPaymentId { get; set; } = string.Empty;
    public decimal TotalPrice { get; set; }
    public string Note { get; set; } = string.Empty;
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateOrderResponse
{
    public bool IsSuccess { get; set; }
    public Dictionary<string, string> Errors { get; set; } = [];
    public string OrderId { get; set; } = string.Empty;
    public string PaymentUrl { get; set; } = string.Empty;
}

public class CreateOrderItemRequest
{
    public string BookId { get; set; } = string.Empty;
    public string BookName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
}

public class CreateOrderRequest
{
    public string UserId { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;

    public List<CreateOrderItemRequest> Items { get; set; } = [];
    public string AddressId { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
}

public class UpdateOrderStatusRequest
{
    public string Status { get; set; } = string.Empty;
}
