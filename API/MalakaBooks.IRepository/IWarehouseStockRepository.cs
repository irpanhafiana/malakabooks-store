using MalakaBooks.Entity;

namespace MalakaBooks.IRepository;

public interface IWarehouseStockRepository
{
    Task<IReadOnlyCollection<WarehouseStockEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<WarehouseStockEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<WarehouseStockEntity> CreateAsync(WarehouseStockEntity warehouseStock, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(string id, WarehouseStockEntity warehouseStock, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default);
}
