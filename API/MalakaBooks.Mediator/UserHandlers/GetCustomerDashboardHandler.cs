using MalakaBooks.IRepository;
using MalakaBooks.ViewModel;
using MediatR;

namespace MalakaBooks.Mediator.UserHandlers;

public class GetCustomerDashboardHandler(
    IOrderRepository orderRepository,
    IReviewRepository reviewRepository,
    IItemRepository itemRepository,
    ICategoryRepository categoryRepository) : IRequestHandler<GetCustomerDashboardQuery, CustomerDashboardResponse>
{
    public async Task<CustomerDashboardResponse> Handle(GetCustomerDashboardQuery request, CancellationToken cancellationToken)
    {
        var orders = await orderRepository.GetByUserIdAsync(request.UserId, cancellationToken);
        var reviews = await reviewRepository.GetByUserIdAsync(request.UserId, cancellationToken);

        // 1. Stat Cards
        var paidOrDeliveredOrders = orders.Where(o => 
            string.Equals(o.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(o.Status, "delivered", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(o.Status, "finished", StringComparison.OrdinalIgnoreCase)).ToList();

        var totalSpending = paidOrDeliveredOrders.Sum(o => o.GrandTotal);
        var totalOrders = orders.Count;
        var totalBooksPurchased = paidOrDeliveredOrders.SelectMany(o => o.Items).Sum(i => i.Quantity);
        var totalReviewsWritten = reviews.Count;

        // 2. Spending Activity (Last 7 Days)
        var spendingActivity = new List<SpendingActivityDto>();
        var today = DateTime.UtcNow.Date;
        for (int i = 6; i >= 0; i--)
        {
            var date = today.AddDays(-i);
            var dailySpending = paidOrDeliveredOrders
                .Where(o => o.CreatedAt.ToUniversalTime().Date == date)
                .Sum(o => o.GrandTotal);

            spendingActivity.Add(new SpendingActivityDto
            {
                Label = date.ToString("ddd"), // Mon, Tue, etc.
                Amount = dailySpending
            });
        }

        // 3. Favorite Categories
        var favoriteCategories = new List<FavoriteCategoryDto>();
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

            favoriteCategories.AddRange(categoryPurchases);
        }

        return new CustomerDashboardResponse
        {
            TotalSpending = totalSpending,
            TotalOrders = totalOrders,
            TotalBooksPurchased = totalBooksPurchased,
            TotalReviewsWritten = totalReviewsWritten,
            SpendingActivity = spendingActivity,
            FavoriteCategories = favoriteCategories
        };
    }
}
