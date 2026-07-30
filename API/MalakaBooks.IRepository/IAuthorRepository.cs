using MalakaBooks.Entity;

namespace MalakaBooks.IRepository;

public interface IAuthorRepository
{
    Task<IReadOnlyCollection<AuthorEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<AuthorEntity>> GetByIdsAsync(IEnumerable<string> ids, CancellationToken cancellationToken = default);
    Task<AuthorEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<AuthorEntity> CreateAsync(AuthorEntity author, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(string id, AuthorEntity author, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default);
}
