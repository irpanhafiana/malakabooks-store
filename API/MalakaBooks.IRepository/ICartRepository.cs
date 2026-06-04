using MalakaBooks.Entity;

namespace MalakaBooks.IRepository;

public interface ICartRepository
{
    Task<IReadOnlyCollection<CartItemEntity>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<CartItemEntity>> AddItemAsync(string userId, CartItemEntity item, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<CartItemEntity>> RemoveItemAsync(string userId, string bookId, CancellationToken cancellationToken = default);
}
