using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.Repository.Configuration;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace MalakaBooks.Repository;

public class OrderRepository : IOrderRepository
{
    private readonly IMongoCollection<OrderEntity> _collection;

    public OrderRepository(IMongoDatabase database, IOptions<MongoDbSetting> mongoDbSetting)
    {
        _collection = database.GetCollection<OrderEntity>(mongoDbSetting.Value.OrdersCollection);
    }

    public async Task<OrderEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyCollection<OrderEntity>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _collection.Find(_ => true).ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<OrderEntity>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.UserId == userId).ToListAsync(cancellationToken);

    public async Task<OrderEntity> CreateAsync(OrderEntity order, CancellationToken cancellationToken = default)
    {
        await _collection.InsertOneAsync(order, cancellationToken: cancellationToken);
        return order;
    }

    public async Task<bool> UpdateAsync(string id, OrderEntity order, CancellationToken cancellationToken = default)
    {
        order.Id = id;
        var result = await _collection.ReplaceOneAsync(x => x.Id == id, order, cancellationToken: cancellationToken);
        return result.ModifiedCount > 0;
    }
}
