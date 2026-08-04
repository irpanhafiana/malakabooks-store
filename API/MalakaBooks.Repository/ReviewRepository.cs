using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.Repository.Configuration;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace MalakaBooks.Repository;

public class ReviewRepository : IReviewRepository
{
    private readonly IMongoCollection<ReviewEntity> _collection;

    public ReviewRepository(IMongoDatabase database, IOptions<MongoDbSetting> mongoDbSetting)
    {
        _collection = database.GetCollection<ReviewEntity>(mongoDbSetting.Value.ReviewsCollection);
    }

    public async Task<IReadOnlyCollection<ReviewEntity>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _collection.Find(Builders<ReviewEntity>.Filter.Empty).ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<ReviewEntity>> GetByItemIdAsync(string itemId, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.ItemId == itemId).ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<ReviewEntity>> GetByItemIdsAsync(IEnumerable<string> itemIds, CancellationToken cancellationToken = default) =>
        await _collection.Find(Builders<ReviewEntity>.Filter.In(x => x.ItemId, itemIds)).ToListAsync(cancellationToken);

    public async Task<ReviewEntity?> GetByUserOrderAndItemAsync(string userId, string orderId, string itemId, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.UserId == userId && x.OrderId == orderId && x.ItemId == itemId).FirstOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyCollection<ReviewEntity>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.UserId == userId).ToListAsync(cancellationToken);

    public async Task<ReviewEntity> CreateAsync(ReviewEntity review, CancellationToken cancellationToken = default)
    {
        await _collection.InsertOneAsync(review, cancellationToken: cancellationToken);
        return review;
    }
}
