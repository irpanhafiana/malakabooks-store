using MalakaBooks.Entity;

namespace MalakaBooks.IRepository;

public interface IItemRepository
{
    Task<IReadOnlyCollection<ItemEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ItemEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<ItemEntity> CreateAsync(ItemEntity item, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(string id, ItemEntity item, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default);
}
