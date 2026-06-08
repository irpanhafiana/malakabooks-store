using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.Repository.Configuration;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace MalakaBooks.Repository;

public class AddressRepository : IAddressRepository
{
    private readonly IMongoCollection<AddressEntity> _collection;

    public AddressRepository(IMongoDatabase database, IOptions<MongoDbSetting> mongoDbSetting)
    {
        _collection = database.GetCollection<AddressEntity>(mongoDbSetting.Value.AddressesCollection);
    }

    public async Task<AddressEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyCollection<AddressEntity>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.UserId == userId).ToListAsync(cancellationToken);

    public async Task<AddressEntity> CreateAsync(AddressEntity address, CancellationToken cancellationToken = default)
    {
        await _collection.InsertOneAsync(address, cancellationToken: cancellationToken);
        return address;
    }

    public async Task<bool> UpdateAsync(string id, AddressEntity address, CancellationToken cancellationToken = default)
    {
        address.Id = id;
        var result = await _collection.ReplaceOneAsync(x => x.Id == id, address, cancellationToken: cancellationToken);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var result = await _collection.DeleteOneAsync(x => x.Id == id, cancellationToken);
        return result.DeletedCount > 0;
    }
}
