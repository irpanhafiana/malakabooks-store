using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.Repository.Configuration;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace MalakaBooks.Repository;

public class WarehouseStockRepository : IWarehouseStockRepository
{
    private readonly IMongoCollection<WarehouseStockEntity> _collection;

    public WarehouseStockRepository(IMongoDatabase database, IOptions<MongoDbSetting> mongoDbSetting)
    {
        _collection = database.GetCollection<WarehouseStockEntity>(mongoDbSetting.Value.WarehouseStocksCollection);
    }

    public async Task<IReadOnlyCollection<WarehouseStockEntity>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _collection.Find(Builders<WarehouseStockEntity>.Filter.Empty).ToListAsync(cancellationToken);

    public async Task<WarehouseStockEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync(cancellationToken);

    public async Task<WarehouseStockEntity> CreateAsync(WarehouseStockEntity warehouseStock, CancellationToken cancellationToken = default)
    {
        await _collection.InsertOneAsync(warehouseStock, cancellationToken: cancellationToken);
        return warehouseStock;
    }

    public async Task<bool> UpdateAsync(string id, WarehouseStockEntity warehouseStock, CancellationToken cancellationToken = default)
    {
        warehouseStock.Id = id;
        var result = await _collection.ReplaceOneAsync(x => x.Id == id, warehouseStock, cancellationToken: cancellationToken);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var result = await _collection.DeleteOneAsync(x => x.Id == id, cancellationToken);
        return result.DeletedCount > 0;
    }
}
