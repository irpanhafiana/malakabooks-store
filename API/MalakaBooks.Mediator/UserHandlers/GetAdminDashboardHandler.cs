using MalakaBooks.IRepository;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.UserHandlers;

public class GetAdminDashboardHandler(
    IOrderRepository orderRepository,
    IUserRepository userRepository,
    IItemRepository itemRepository,
    ICategoryRepository categoryRepository) : IRequestHandler<GetAdminDashboardQuery, AdminDashboardResponse>
{
    public async Task<AdminDashboardResponse> Handle(GetAdminDashboardQuery request, CancellationToken cancellationToken)
    {
        var orders = await orderRepository.GetAllAsync(cancellationToken);
        var users = await userRepository.GetAllAsync(cancellationToken);

        // 1. Stat Cards
        var paidOrDeliveredOrders = orders.Where(o => 
            string.Equals(o.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(o.Status, "delivered", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(o.Status, "finished", StringComparison.OrdinalIgnoreCase)).ToList();

        var totalRevenue = paidOrDeliveredOrders.Sum(o => o.GrandTotal);
        var totalOrders = orders.Count;
        
        var activeCustomers = orders.Select(o => o.User.UserId).Where(id => !string.IsNullOrEmpty(id)).Distinct().Count();
        var totalUsers = users.Count;
        var conversionRate = totalUsers > 0 ? ((double)activeCustomers / totalUsers) * 100 : 0;

        // 2. Sales Activity (Last 7 Days)
        var salesActivity = new List<SpendingActivityDto>();
        var today = DateTime.UtcNow.Date;
        for (int i = 6; i >= 0; i--)
        {
            var date = today.AddDays(-i);
            var dailySales = paidOrDeliveredOrders
                .Where(o => o.CreatedAt.ToUniversalTime().Date == date)
                .Sum(o => o.GrandTotal);

            salesActivity.Add(new SpendingActivityDto
            {
                Label = date.ToString("ddd"), // Mon, Tue, etc.
                Amount = dailySales
            });
        }

        // 3. Top Categories
        var topCategories = new List<FavoriteCategoryDto>();
        var purchasedItems = paidOrDeliveredOrders.SelectMany(o => o.Items).ToList();
        var itemIds = purchasedItems.Select(i => i.ItemId).Distinct().ToList();

        if (itemIds.Any())
        {
            var items = await itemRepository.GetByIdsAsync(itemIds, cancellationToken);
            var categoryIds = items.Where(i => !string.IsNullOrEmpty(i.CategoryId)).Select(i => i.CategoryId).Distinct().ToList();
            
            var categories = new Dictionary<string, string>();
            if (categoryIds.Any())
            {
                var categoryEntities = await categoryRepository.GetByIdsAsync(categoryIds!, cancellationToken);
                categories = categoryEntities.Where(c => !string.IsNullOrEmpty(c.Id)).ToDictionary(c => c.Id!, c => c.Name);
            }

            var itemCategories = items.Where(i => !string.IsNullOrEmpty(i.Id)).ToDictionary(i => i.Id!, i => i.CategoryId ?? string.Empty);

            var categoryPurchases = purchasedItems
                .Where(p => itemCategories.ContainsKey(p.ItemId) && !string.IsNullOrEmpty(itemCategories[p.ItemId]))
                .GroupBy(p => itemCategories[p.ItemId])
                .Select(g => new FavoriteCategoryDto
                {
                    CategoryName = categories.GetValueOrDefault(g.Key, "Unknown"),
                    TotalSpent = g.Sum(i => i.Price * i.Quantity),
                    QuantityPurchased = g.Sum(i => i.Quantity)
                })
                .OrderByDescending(c => c.TotalSpent)
                .Take(5)
                .ToList();

            topCategories.AddRange(categoryPurchases);
        }

        return new AdminDashboardResponse
        {
            TotalRevenue = totalRevenue,
            TotalOrders = totalOrders,
            ActiveCustomers = activeCustomers,
            ConversionRate = Math.Round(conversionRate, 2),
            SalesActivity = salesActivity,
            TopCategories = topCategories
        };
    }
}
