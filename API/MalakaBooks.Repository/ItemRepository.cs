using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.Repository.Configuration;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace MalakaBooks.Repository;

public class ItemRepository : IItemRepository
{
    private readonly IMongoCollection<ItemEntity> _collection;

    public ItemRepository(IMongoDatabase database, IOptions<MongoDbSetting> mongoDbSetting)
    {
        _collection = database.GetCollection<ItemEntity>(mongoDbSetting.Value.ItemsCollection);
    }

    public async Task<IReadOnlyCollection<ItemEntity>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _collection.Find(Builders<ItemEntity>.Filter.Empty).ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<ItemEntity>> GetByIdsAsync(IEnumerable<string> ids, CancellationToken cancellationToken = default) =>
        await _collection.Find(Builders<ItemEntity>.Filter.In(x => x.Id, ids)).ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<ItemEntity>> GetByItemTypeAsync(string itemType, CancellationToken cancellationToken = default)
    {
        var normalizedItemType = itemType.Trim();
        var filter = Builders<ItemEntity>.Filter.Regex(
            item => item.ItemType,
            new MongoDB.Bson.BsonRegularExpression($"^{System.Text.RegularExpressions.Regex.Escape(normalizedItemType)}$", "i"));

        return await _collection.Find(filter).ToListAsync(cancellationToken);
    }

    public async Task<ItemEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync(cancellationToken);

    public async Task<ItemEntity?> GetBySapCodeAsync(string sapCode, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.SAPCode == sapCode).FirstOrDefaultAsync(cancellationToken);

    public async Task<ItemEntity> CreateAsync(ItemEntity item, CancellationToken cancellationToken = default)
    {
        await _collection.InsertOneAsync(item, cancellationToken: cancellationToken);
        return item;
    }

    public async Task<bool> UpdateAsync(string id, ItemEntity item, CancellationToken cancellationToken = default)
    {
        item.Id = id;
        var result = await _collection.ReplaceOneAsync(x => x.Id == id, item, cancellationToken: cancellationToken);
        return result.ModifiedCount > 0;
    }

    public async Task<ItemEntity?> AdjustStockAsync(string id, int quantityDelta, CancellationToken cancellationToken = default)
    {
        var update = Builders<ItemEntity>.Update.Inc(item => item.Stock, quantityDelta);
        return await _collection.FindOneAndUpdateAsync(
            item => item.Id == id,
            update,
            new FindOneAndUpdateOptions<ItemEntity>
            {
                ReturnDocument = ReturnDocument.After
            },
            cancellationToken);
    }

    public async Task<ItemEntity?> SetStockAsync(string id, int newStock, CancellationToken cancellationToken = default)
    {
        var update = Builders<ItemEntity>.Update.Set(item => item.Stock, newStock);
        return await _collection.FindOneAndUpdateAsync(
            item => item.Id == id,
            update,
            new FindOneAndUpdateOptions<ItemEntity>
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
