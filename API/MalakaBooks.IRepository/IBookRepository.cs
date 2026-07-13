using MalakaBooks.Entity;

namespace MalakaBooks.IRepository;

public interface IBookRepository
{
    Task<IReadOnlyCollection<BookEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<BookEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<BookEntity?> GetByItemIdAsync(string itemId, CancellationToken cancellationToken = default);
    Task<BookEntity> CreateAsync(BookEntity book, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(string id, BookEntity book, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default);
}
