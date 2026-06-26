using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.Repository.Configuration;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace MalakaBooks.Repository;

public class AuthorRepository : IAuthorRepository
{
    private readonly IMongoCollection<AuthorEntity> _collection;

    public AuthorRepository(IMongoDatabase database, IOptions<MongoDbSetting> mongoDbSetting)
    {
        _collection = database.GetCollection<AuthorEntity>(mongoDbSetting.Value.AuthorsCollection);
    }

    public async Task<IReadOnlyCollection<AuthorEntity>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _collection.Find(Builders<AuthorEntity>.Filter.Empty).ToListAsync(cancellationToken);

    public async Task<AuthorEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync(cancellationToken);

    public async Task<AuthorEntity> CreateAsync(AuthorEntity author, CancellationToken cancellationToken = default)
    {
        await _collection.InsertOneAsync(author, cancellationToken: cancellationToken);
        return author;
    }

    public async Task<bool> UpdateAsync(string id, AuthorEntity author, CancellationToken cancellationToken = default)
    {
        author.Id = id;
        var result = await _collection.ReplaceOneAsync(x => x.Id == id, author, cancellationToken: cancellationToken);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var result = await _collection.DeleteOneAsync(x => x.Id == id, cancellationToken);
        return result.DeletedCount > 0;
    }
}
