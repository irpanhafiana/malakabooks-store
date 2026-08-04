using MalakaBooks.Entity;

namespace MalakaBooks.IRepository;

public interface IItemRepository
{
    Task<IReadOnlyCollection<ItemEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<ItemEntity>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<ItemEntity>> GetByIdsAsync(IEnumerable<string> ids, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<ItemEntity>> GetByItemTypeAsync(string itemType, CancellationToken cancellationToken = default);
    Task<ItemEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<ItemEntity?> GetBySapCodeAsync(string sapCode, CancellationToken cancellationToken = default);
    Task<ItemEntity> CreateAsync(ItemEntity item, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(string id, ItemEntity item, CancellationToken cancellationToken = default);
    Task<ItemEntity?> AdjustStockAsync(string id, int quantityDelta, CancellationToken cancellationToken = default);
    Task<ItemEntity?> SetStockAsync(string id, int newStock, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default);
}
