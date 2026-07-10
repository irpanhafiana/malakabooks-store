using MalakaBooks.Entity;

namespace MalakaBooks.IRepository;

public interface IReviewRepository
{
    Task<IReadOnlyCollection<ReviewEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<ReviewEntity>> GetByBookIdAsync(string bookId, CancellationToken cancellationToken = default);
    Task<ReviewEntity?> GetByUserOrderAndBookAsync(string userId, string orderId, string bookId, CancellationToken cancellationToken = default);
    Task<ReviewEntity> CreateAsync(ReviewEntity review, CancellationToken cancellationToken = default);
}
