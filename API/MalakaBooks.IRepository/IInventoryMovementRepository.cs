using MalakaBooks.Entity;

namespace MalakaBooks.IRepository;

public interface IInventoryMovementRepository
{
    Task<IReadOnlyCollection<InventoryMovementEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<InventoryMovementEntity>> GetByItemIdAsync(string itemId, CancellationToken cancellationToken = default);
    Task<InventoryMovementEntity> CreateAsync(InventoryMovementEntity movement, CancellationToken cancellationToken = default);
}
