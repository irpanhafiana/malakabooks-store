using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.Repository.Configuration;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace MalakaBooks.Repository;

public class WarehouseRepository : IWarehouseRepository
{
    private readonly IMongoCollection<WarehouseEntity> _collection;

    public WarehouseRepository(IMongoDatabase database, IOptions<MongoDbSetting> mongoDbSetting)
    {
        _collection = database.GetCollection<WarehouseEntity>(mongoDbSetting.Value.WarehousesCollection);
    }

    public async Task<IReadOnlyCollection<WarehouseEntity>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _collection.Find(Builders<WarehouseEntity>.Filter.Empty).ToListAsync(cancellationToken);

    public async Task<WarehouseEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync(cancellationToken);

    public async Task<WarehouseEntity> CreateAsync(WarehouseEntity warehouse, CancellationToken cancellationToken = default)
    {
        await _collection.InsertOneAsync(warehouse, cancellationToken: cancellationToken);
        return warehouse;
    }

    public async Task<bool> UpdateAsync(string id, WarehouseEntity warehouse, CancellationToken cancellationToken = default)
    {
        warehouse.Id = id;
        var result = await _collection.ReplaceOneAsync(x => x.Id == id, warehouse, cancellationToken: cancellationToken);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var result = await _collection.DeleteOneAsync(x => x.Id == id, cancellationToken);
        return result.DeletedCount > 0;
    }
}
