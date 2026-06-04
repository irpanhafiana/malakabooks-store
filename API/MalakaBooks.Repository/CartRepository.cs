using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.Repository.Configuration;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Driver;

namespace MalakaBooks.Repository;

public class CartRepository : ICartRepository
{
    private readonly IMongoCollection<CartDocument> _collection;

    public CartRepository(IMongoDatabase database, IOptions<MongoDbSetting> mongoDbSetting)
    {
        _collection = database.GetCollection<CartDocument>(mongoDbSetting.Value.CartsCollection);
    }

    public async Task<IReadOnlyCollection<CartItemEntity>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        var cart = await _collection.Find(x => x.UserId == userId).FirstOrDefaultAsync(cancellationToken);
        return cart?.Items?.ToArray() ?? Array.Empty<CartItemEntity>();
    }

    public async Task<IReadOnlyCollection<CartItemEntity>> AddItemAsync(string userId, CartItemEntity item, CancellationToken cancellationToken = default)
    {
        var cart = await _collection.Find(x => x.UserId == userId).FirstOrDefaultAsync(cancellationToken) ?? new CartDocument { UserId = userId };
        var existing = cart.Items.FirstOrDefault(x => x.BookId == item.BookId);
        if (existing is null)
        {
            cart.Items.Add(item);
        }
        else
        {
            existing.Quantity += item.Quantity;
        }

        await SaveAsync(cart, cancellationToken);
        return cart.Items;
    }

    public async Task<IReadOnlyCollection<CartItemEntity>> RemoveItemAsync(string userId, string bookId, CancellationToken cancellationToken = default)
    {
        var cart = await _collection.Find(x => x.UserId == userId).FirstOrDefaultAsync(cancellationToken);
        if (cart is null)
        {
            return Array.Empty<CartItemEntity>();
        }

        cart.Items.RemoveAll(x => x.BookId == bookId);
        await SaveAsync(cart, cancellationToken);
        return cart.Items;
    }

    private async Task SaveAsync(CartDocument cart, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(cart.Id))
        {
            await _collection.InsertOneAsync(cart, cancellationToken: cancellationToken);
            return;
        }

        await _collection.ReplaceOneAsync(x => x.Id == cart.Id, cart, cancellationToken: cancellationToken);
    }

    private sealed class CartDocument
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string UserId { get; set; } = string.Empty;

        public List<CartItemEntity> Items { get; set; } = new();
    }
}
