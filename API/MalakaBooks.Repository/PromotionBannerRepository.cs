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

    public async Task<PromotionBannerEntity> CreateAsync(PromotionBannerEntity promotionBanner, CancellationToken cancellationToken = default)
    {
        await _collection.InsertOneAsync(promotionBanner, cancellationToken: cancellationToken);
        return promotionBanner;
    }
}
