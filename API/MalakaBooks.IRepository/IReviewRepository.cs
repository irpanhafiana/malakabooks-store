using MalakaBooks.Entity;

namespace MalakaBooks.IRepository;

public interface IReviewRepository
{
    Task<IReadOnlyCollection<ReviewEntity>> GetByBookIdAsync(string bookId, CancellationToken cancellationToken = default);
    Task<ReviewEntity> CreateAsync(ReviewEntity review, CancellationToken cancellationToken = default);
}
