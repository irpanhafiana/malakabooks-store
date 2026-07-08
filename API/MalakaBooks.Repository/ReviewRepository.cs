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

    public async Task<IReadOnlyCollection<ReviewEntity>> GetByBookIdAsync(string bookId, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.BookId == bookId).ToListAsync(cancellationToken);

    public async Task<ReviewEntity?> GetByUserOrderAndBookAsync(string userId, string orderId, string bookId, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.UserId == userId && x.OrderId == orderId && x.BookId == bookId).FirstOrDefaultAsync(cancellationToken);

    public async Task<ReviewEntity> CreateAsync(ReviewEntity review, CancellationToken cancellationToken = default)
    {
        await _collection.InsertOneAsync(review, cancellationToken: cancellationToken);
        return review;
    }
}
