using MalakaBooks.Entity;

namespace MalakaBooks.IRepository;

public interface IOrderRepository
{
    Task<OrderEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<OrderEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<OrderEntity>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<OrderEntity> CreateAsync(OrderEntity order, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(string id, OrderEntity order, CancellationToken cancellationToken = default);
}
