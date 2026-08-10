namespace MalakaBooks.ViewModel;

public class AdminDashboardResponse
{
    // 1. Stat Cards
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
    public int ActiveCustomers { get; set; }
    public double ConversionRate { get; set; } // Percentage

    // 2. Line Chart (Last 7 Days)
    public List<SpendingActivityDto> SalesActivity { get; set; } = [];

    // 3. Category List
    public List<FavoriteCategoryDto> TopCategories { get; set; } = [];
}
