using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.Repository.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Subur.Extension;
using Subur.Storage.MongoDbProvider;
using System.Text.Json;

namespace MalakaBooks.Repository;

public class OrderRepository : BaseRepository<OrderEntity>, IOrderRepository
{
    private readonly IMongoCollection<OrderEntity> _collection;
    private readonly IOptions<MongoDbSetting> _mongoDbSetting;

    public OrderRepository(
      MongoDbContext mongoDbContext,
      IMongoClient mongoClient,
      IHttpContextAccessor contextAccessor,
      IOptions<MongoDbSetting> mongoDbSetting) : base(mongoDbContext, mongoClient, contextAccessor)
    {
        _collection = mongoDbContext.GetCollection<OrderEntity>(mongoDbSetting.Value.OrdersCollection);
        _mongoDbSetting = mongoDbSetting;
    }

    public async Task<OrderEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync(cancellationToken);

    public async Task<OrderEntity?> GetByShipmentReferenceAsync(string referenceNo, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(referenceNo))
        {
            return null;
        }

        var orders = await _collection.Find(order => !string.IsNullOrWhiteSpace(order.ShipmentDetailJson)).ToListAsync(cancellationToken);

        foreach (var order in orders)
        {
            if (string.IsNullOrWhiteSpace(order.ShipmentDetailJson))
            {
                continue;
            }

            try
            {
                using var payload = JsonDocument.Parse(order.ShipmentDetailJson);
                var root = payload.RootElement;
                var storedReference = TryGetPropertyValue(root, "ReferenceNo")
                    ?? TryGetPropertyValue(root, "referenceNo")
                    ?? TryGetPropertyValue(root, "reference_no");

                if (string.Equals(storedReference, referenceNo, StringComparison.OrdinalIgnoreCase))
                {
                    return order;
                }
            }
            catch
            {
                // Ignore malformed stored shipment payloads and continue searching.
            }
        }

        return null;
    }

    private static string? TryGetPropertyValue(JsonElement element, string propertyName)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        return element.TryGetProperty(propertyName, out var value)
            ? value.GetString()
            : null;
    }

    public async Task<IReadOnlyCollection<OrderEntity>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _collection.Find(_ => true).ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<OrderEntity>> GetByItemIdsAsync(IEnumerable<string> itemIds, CancellationToken cancellationToken = default)
    {
        var filter = Builders<OrderEntity>.Filter.ElemMatch(
            order => order.Items,
            Builders<OrderItemEntity>.Filter.In(item => item.ItemId, itemIds)
        );
        return await _collection.Find(filter).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<OrderEntity>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.User.UserId == userId).ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<OrderEntity>> GetShippedOrdersWithAwbAsync(CancellationToken cancellationToken = default)
    {
        var filter = Builders<OrderEntity>.Filter.And(
            Builders<OrderEntity>.Filter.Eq(order => order.Status, "shipped"),
            Builders<OrderEntity>.Filter.Ne(order => order.AWBNo, null),
            Builders<OrderEntity>.Filter.Ne(order => order.AWBNo, string.Empty));

        return await _collection.Find(filter).ToListAsync(cancellationToken);
    }

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

    public async Task<bool> MarkAsDeliveredAsync(string id, DateTime utcNow, CancellationToken cancellationToken = default)
    {
        var filter = Builders<OrderEntity>.Filter.And(
            Builders<OrderEntity>.Filter.Eq(order => order.Id, id),
            Builders<OrderEntity>.Filter.Ne(order => order.Status, "delivered"));

        var update = Builders<OrderEntity>.Update
            .Set(order => order.Status, "delivered")
            .Set(order => order.UpdatedAt, utcNow);

        var result = await _collection.UpdateOneAsync(filter, update, cancellationToken: cancellationToken);
        return result.ModifiedCount > 0;
    }

    public async Task<PagedResult<OrderEntity>> GetAllOrdersPaged(long pageNumber, long pageSize)
    {
        var filter = Builders<OrderEntity>.Filter.Empty;
        var sort = Builders<OrderEntity>.Sort.Descending(_ => _.DateCreated);

        PagedResult<OrderEntity> orders = await QueryByPageAsync(_mongoDbSetting.Value.OrdersCollection, sort, filter, pageNumber, pageSize);

        return orders;
    }

    public async Task<long> ExpireUnpaidOrdersAsync(DateTime utcNow, CancellationToken cancellationToken = default)
    {
        var filter = Builders<OrderEntity>.Filter.And(
            Builders<OrderEntity>.Filter.Ne(order => order.ExpiresAt, null),
            Builders<OrderEntity>.Filter.Lte(order => order.ExpiresAt, utcNow),
            Builders<OrderEntity>.Filter.Ne(order => order.PaymentStatus, "paid"),
            Builders<OrderEntity>.Filter.Ne(order => order.PaymentStatus, "expired"));

        var update = Builders<OrderEntity>.Update
            .Set(order => order.Status, "expired")
            .Set(order => order.PaymentStatus, "expired")
            .Set(order => order.ExpiresAt, null)
            .Set(order => order.UpdatedAt, utcNow);

        var result = await _collection.UpdateManyAsync(filter, update, cancellationToken: cancellationToken);
        return result.ModifiedCount;
    }

}
