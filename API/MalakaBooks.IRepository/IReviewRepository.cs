using MalakaBooks.Entity;

namespace MalakaBooks.IRepository;

public interface IReviewRepository
{
    Task<IReadOnlyCollection<ReviewEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<ReviewEntity>> GetByItemIdAsync(string itemId, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<ReviewEntity>> GetByItemIdsAsync(IEnumerable<string> itemIds, CancellationToken cancellationToken = default);
    Task<ReviewEntity?> GetByUserOrderAndItemAsync(string userId, string orderId, string itemId, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<ReviewEntity>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<ReviewEntity> CreateAsync(ReviewEntity review, CancellationToken cancellationToken = default);
}
