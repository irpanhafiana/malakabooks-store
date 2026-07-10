using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.Repository.Configuration;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace MalakaBooks.Repository;

public class BookRepository : IBookRepository
{
    private readonly IMongoCollection<BookEntity> _collection;

    public BookRepository(IMongoDatabase database, IOptions<MongoDbSetting> mongoDbSetting)
    {
        _collection = database.GetCollection<BookEntity>(mongoDbSetting.Value.BooksCollection);
    }

    public async Task<IReadOnlyCollection<BookEntity>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _collection.Find(Builders<BookEntity>.Filter.Empty).ToListAsync(cancellationToken);

    public async Task<BookEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync(cancellationToken);

    public async Task<BookEntity> CreateAsync(BookEntity book, CancellationToken cancellationToken = default)
    {
        await _collection.InsertOneAsync(book, cancellationToken: cancellationToken);
        return book;
    }

    public async Task<bool> UpdateAsync(string id, BookEntity book, CancellationToken cancellationToken = default)
    {
        book.Id = id;
        var result = await _collection.ReplaceOneAsync(x => x.Id == id, book, cancellationToken: cancellationToken);
        return result.ModifiedCount > 0;
    }

    public async Task<BookEntity?> AdjustStockAsync(string id, int quantityDelta, CancellationToken cancellationToken = default)
    {
        var update = Builders<BookEntity>.Update.Inc(book => book.Stock, quantityDelta);
        return await _collection.FindOneAndUpdateAsync(
            book => book.Id == id,
            update,
            new FindOneAndUpdateOptions<BookEntity>
            {
                ReturnDocument = ReturnDocument.After
            },
            cancellationToken);
    }

    public async Task<BookEntity?> SetStockAsync(string id, int newStock, CancellationToken cancellationToken = default)
    {
        var update = Builders<BookEntity>.Update.Set(book => book.Stock, newStock);
        return await _collection.FindOneAndUpdateAsync(
            book => book.Id == id,
            update,
            new FindOneAndUpdateOptions<BookEntity>
            {
                ReturnDocument = ReturnDocument.After
            },
            cancellationToken);
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var result = await _collection.DeleteOneAsync(x => x.Id == id, cancellationToken);
        return result.DeletedCount > 0;
    }
}
