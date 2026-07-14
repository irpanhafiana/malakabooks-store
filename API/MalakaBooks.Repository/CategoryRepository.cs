using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.Repository.Configuration;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace MalakaBooks.Repository;

public class CategoryRepository : ICategoryRepository
{
    private readonly IMongoCollection<CategoryEntity> _collection;

    public CategoryRepository(IMongoDatabase database, IOptions<MongoDbSetting> mongoDbSetting)
    {
        _collection = database.GetCollection<CategoryEntity>(mongoDbSetting.Value.CategoriesCollection);
    }

    public async Task<IReadOnlyCollection<CategoryEntity>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _collection.Find(Builders<CategoryEntity>.Filter.Empty).ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<CategoryEntity>> GetByIdsAsync(IReadOnlyCollection<string> ids, CancellationToken cancellationToken = default)
    {
        if (ids.Count == 0)
        {
            return [];
        }

        var filter = Builders<CategoryEntity>.Filter.In(category => category.Id, ids);
        return await _collection.Find(filter).ToListAsync(cancellationToken);
    }

    public async Task<CategoryEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync(cancellationToken);

    public async Task<CategoryEntity> CreateAsync(CategoryEntity category, CancellationToken cancellationToken = default)
    {
        await _collection.InsertOneAsync(category, cancellationToken: cancellationToken);
        return category;
    }

    public async Task<bool> UpdateAsync(string id, CategoryEntity category, CancellationToken cancellationToken = default)
    {
        category.Id = id;
        var result = await _collection.ReplaceOneAsync(x => x.Id == id, category, cancellationToken: cancellationToken);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var result = await _collection.DeleteOneAsync(x => x.Id == id, cancellationToken);
        return result.DeletedCount > 0;
    }
}
