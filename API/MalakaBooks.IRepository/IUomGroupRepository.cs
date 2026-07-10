using MalakaBooks.Entity;

namespace MalakaBooks.IRepository;

public interface IUomGroupRepository
{
    Task<IReadOnlyCollection<UomGroupEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<UomGroupEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<UomGroupEntity> CreateAsync(UomGroupEntity uomGroup, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(string id, UomGroupEntity uomGroup, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default);
}
