using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.Repository.Configuration;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace MalakaBooks.Repository;

public class InventoryMovementRepository : IInventoryMovementRepository
{
    private readonly IMongoCollection<InventoryMovementEntity> _collection;

    public InventoryMovementRepository(IMongoDatabase database, IOptions<MongoDbSetting> mongoDbSetting)
    {
        _collection = database.GetCollection<InventoryMovementEntity>(mongoDbSetting.Value.InventoryMovementsCollection);
    }

    public async Task<IReadOnlyCollection<InventoryMovementEntity>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _collection.Find(_ => true)
            .SortByDescending(movement => movement.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<InventoryMovementEntity>> GetByItemIdAsync(string itemId, CancellationToken cancellationToken = default) =>
        await _collection.Find(movement => movement.ItemId == itemId)
            .SortByDescending(movement => movement.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<InventoryMovementEntity> CreateAsync(InventoryMovementEntity movement, CancellationToken cancellationToken = default)
    {
        await _collection.InsertOneAsync(movement, cancellationToken: cancellationToken);
        return movement;
    }
}
