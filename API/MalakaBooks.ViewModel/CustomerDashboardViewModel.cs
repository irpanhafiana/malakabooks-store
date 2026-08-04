namespace MalakaBooks.ViewModel;

public class CustomerDashboardResponse
{
    // 1. Stat Cards
    public decimal TotalSpending { get; set; }
    public int TotalOrders { get; set; }
    public int TotalBooksPurchased { get; set; }
    public int TotalReviewsWritten { get; set; }

    // 2. Line Chart (Last 7 Days)
    public List<SpendingActivityDto> SpendingActivity { get; set; } = [];

    // 3. Category List
    public List<FavoriteCategoryDto> FavoriteCategories { get; set; } = [];
}

public class SpendingActivityDto
{
    public string Label { get; set; } = string.Empty; // e.g., "Mon", "Tue"
    public decimal Amount { get; set; }
}

public class FavoriteCategoryDto
{
    public string CategoryName { get; set; } = string.Empty;
    public decimal TotalSpent { get; set; }
    public int QuantityPurchased { get; set; }
}
