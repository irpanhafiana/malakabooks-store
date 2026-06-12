using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.Repository.Configuration;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace MalakaBooks.Repository;

public class HomeAddressRepository : IHomeAddressRepository
{
    private readonly IMongoCollection<HomeAddressEntity> _collection;

    public HomeAddressRepository(IMongoDatabase database, IOptions<MongoDbSetting> mongoDbSetting)
    {
        _collection = database.GetCollection<HomeAddressEntity>(mongoDbSetting.Value.HomeAddressesCollection);
    }

    public async Task<HomeAddressEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync(cancellationToken);

    public async Task<HomeAddressEntity> CreateAsync(HomeAddressEntity address, CancellationToken cancellationToken = default)
    {
        await _collection.InsertOneAsync(address, cancellationToken: cancellationToken);
        return address;
    }

    public async Task<bool> UpdateAsync(string id, HomeAddressEntity address, CancellationToken cancellationToken = default)
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

    public async Task<IReadOnlyCollection<HomeAddressEntity>> GetAllAsync(CancellationToken cancellationToken = default) =>
          await _collection.Find(FilterDefinition<HomeAddressEntity>.Empty).ToListAsync(cancellationToken);
}
