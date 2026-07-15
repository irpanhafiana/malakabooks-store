using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.Repository.Configuration;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace MalakaBooks.Repository;

public class PricingRepository : IPricingRepository
{
    private readonly IMongoCollection<PricingEntity> _collection;

    public PricingRepository(IMongoDatabase database, IOptions<MongoDbSetting> mongoDbSetting)
    {
        _collection = database.GetCollection<PricingEntity>(mongoDbSetting.Value.PricingsCollection);
    }

    public async Task<IReadOnlyCollection<PricingEntity>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _collection.Find(Builders<PricingEntity>.Filter.Empty).ToListAsync(cancellationToken);

    public async Task<PricingEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyCollection<PricingEntity>> GetActiveByItemIdAsync(string itemId, DateTime asOfUtc, CancellationToken cancellationToken = default)
    {
        var filter = Builders<PricingEntity>.Filter.Where(pricing =>
            pricing.IsActive
            && pricing.ItemId == itemId
            && pricing.StartDate <= asOfUtc
            && pricing.EndDate >= asOfUtc);

        var sort = Builders<PricingEntity>.Sort.Descending(pricing => pricing.StartDate);
        return await _collection.Find(filter).Sort(sort).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<PricingEntity>> GetActiveByItemIdsAsync(IReadOnlyCollection<string> itemIds, DateTime asOfUtc, CancellationToken cancellationToken = default)
    {
        if (itemIds.Count == 0)
        {
            return [];
        }

        var filter = Builders<PricingEntity>.Filter.Where(pricing =>
            pricing.IsActive
            && itemIds.Contains(pricing.ItemId)
            && pricing.StartDate <= asOfUtc
            && pricing.EndDate >= asOfUtc);

        var sort = Builders<PricingEntity>.Sort
            .Ascending(pricing => pricing.ItemId)
            .Descending(pricing => pricing.StartDate);

        return await _collection.Find(filter).Sort(sort).ToListAsync(cancellationToken);
    }

    public async Task<PricingEntity> CreateAsync(PricingEntity pricing, CancellationToken cancellationToken = default)
    {
        await _collection.InsertOneAsync(pricing, cancellationToken: cancellationToken);
        return pricing;
    }

    public async Task<bool> UpdateAsync(string id, PricingEntity pricing, CancellationToken cancellationToken = default)
    {
        pricing.Id = id;
        var result = await _collection.ReplaceOneAsync(x => x.Id == id, pricing, cancellationToken: cancellationToken);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var result = await _collection.DeleteOneAsync(x => x.Id == id, cancellationToken);
        return result.DeletedCount > 0;
    }
}
