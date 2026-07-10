using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.Repository.Configuration;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace MalakaBooks.Repository;

public class UomGroupRepository : IUomGroupRepository
{
    private readonly IMongoCollection<UomGroupEntity> _collection;

    public UomGroupRepository(IMongoDatabase database, IOptions<MongoDbSetting> mongoDbSetting)
    {
        _collection = database.GetCollection<UomGroupEntity>(mongoDbSetting.Value.UomGroupsCollection);
    }

    public async Task<IReadOnlyCollection<UomGroupEntity>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _collection.Find(Builders<UomGroupEntity>.Filter.Empty).ToListAsync(cancellationToken);

    public async Task<UomGroupEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync(cancellationToken);

    public async Task<UomGroupEntity> CreateAsync(UomGroupEntity uomGroup, CancellationToken cancellationToken = default)
    {
        await _collection.InsertOneAsync(uomGroup, cancellationToken: cancellationToken);
        return uomGroup;
    }

    public async Task<bool> UpdateAsync(string id, UomGroupEntity uomGroup, CancellationToken cancellationToken = default)
    {
        uomGroup.Id = id;
        var result = await _collection.ReplaceOneAsync(x => x.Id == id, uomGroup, cancellationToken: cancellationToken);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var result = await _collection.DeleteOneAsync(x => x.Id == id, cancellationToken);
        return result.DeletedCount > 0;
    }
}
