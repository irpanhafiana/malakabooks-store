using MalakaBooks.Entity;

namespace MalakaBooks.IRepository;

public interface ICategoryRepository
{
    Task<IReadOnlyCollection<CategoryEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<CategoryEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<CategoryEntity> CreateAsync(CategoryEntity category, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(string id, CategoryEntity category, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default);
}
