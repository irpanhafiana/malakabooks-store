using MalakaBooks.Entity;

namespace MalakaBooks.IRepository;

public interface IBookRepository
{
    Task<IReadOnlyCollection<BookEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<BookEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<BookEntity> CreateAsync(BookEntity book, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(string id, BookEntity book, CancellationToken cancellationToken = default);
    Task<BookEntity?> AdjustStockAsync(string id, int quantityDelta, CancellationToken cancellationToken = default);
    Task<BookEntity?> SetStockAsync(string id, int newStock, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default);
}
