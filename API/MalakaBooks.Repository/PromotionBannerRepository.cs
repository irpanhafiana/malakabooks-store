using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.Repository.Configuration;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace MalakaBooks.Repository;

public class PromotionBannerRepository : IPromotionBannerRepository
{
    private readonly IMongoCollection<PromotionBannerEntity> _collection;

    public PromotionBannerRepository(IMongoDatabase database, IOptions<MongoDbSetting> mongoDbSetting)
    {
        _collection = database.GetCollection<PromotionBannerEntity>(mongoDbSetting.Value.PromotionBannersCollection);
    }

    public async Task<PromotionBannerEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyCollection<PromotionBannerEntity>> GetActiveAsync(DateTime utcNow, CancellationToken cancellationToken = default)
    {
        var filter = Builders<PromotionBannerEntity>.Filter.And(
            Builders<PromotionBannerEntity>.Filter.Eq(x => x.IsActive, true),
            Builders<PromotionBannerEntity>.Filter.Or(
                Builders<PromotionBannerEntity>.Filter.Eq(x => x.StartAt, null),
                Builders<PromotionBannerEntity>.Filter.Lte(x => x.StartAt, utcNow)),
            Builders<PromotionBannerEntity>.Filter.Or(
                Builders<PromotionBannerEntity>.Filter.Eq(x => x.EndAt, null),
                Builders<PromotionBannerEntity>.Filter.Gte(x => x.EndAt, utcNow)));

        var sort = Builders<PromotionBannerEntity>.Sort
            .Ascending(x => x.DisplayOrder)
            .Descending(x => x.CreatedAt);

        return await _collection.Find(filter).Sort(sort).ToListAsync(cancellationToken);
    }

    public async Task<PromotionBannerEntity> CreateAsync(PromotionBannerEntity promotionBanner, CancellationToken cancellationToken = default)
    {
        await _collection.InsertOneAsync(promotionBanner, cancellationToken: cancellationToken);
        return promotionBanner;
    }

    public async Task<bool> UpdateAsync(string id, PromotionBannerEntity promotionBanner, CancellationToken cancellationToken = default)
    {
        promotionBanner.Id = id;
        var result = await _collection.ReplaceOneAsync(x => x.Id == id, promotionBanner, cancellationToken: cancellationToken);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var result = await _collection.DeleteOneAsync(x => x.Id == id, cancellationToken);
        return result.DeletedCount > 0;
    }
}
