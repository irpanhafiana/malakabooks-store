using MalakaBooks.Entity;

namespace MalakaBooks.IRepository;

public interface IWarehouseRepository
{
    Task<IReadOnlyCollection<WarehouseEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<WarehouseEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<WarehouseEntity> CreateAsync(WarehouseEntity warehouse, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(string id, WarehouseEntity warehouse, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default);
}
