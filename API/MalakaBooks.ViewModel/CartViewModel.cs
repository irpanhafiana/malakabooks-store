namespace MalakaBooks.ViewModel;

public class CartItemResponse
{
    public string BookId { get; set; } = string.Empty;
    public int Quantity { get; set; }
}

public class CartResponse
{
    public string UserId { get; set; } = string.Empty;
    public List<CartItemResponse> Items { get; set; } = [];
}

public class AddCartItemRequest
{
    public string UserId { get; set; } = string.Empty;
    public string BookId { get; set; } = string.Empty;
    public int Quantity { get; set; }
}

public class RemoveCartItemRequest
{
    public string UserId { get; set; } = string.Empty;
    public string BookId { get; set; } = string.Empty;
}
