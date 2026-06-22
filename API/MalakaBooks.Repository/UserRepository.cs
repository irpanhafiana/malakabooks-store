using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.Repository.Configuration;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace MalakaBooks.Repository;

public class UserRepository : IUserRepository
{
    private readonly IMongoCollection<UserEntity> _collection;

    public UserRepository(IMongoDatabase database, IOptions<MongoDbSetting> mongoDbSetting)
    {
        _collection = database.GetCollection<UserEntity>(mongoDbSetting.Value.UsersCollection);
    }

    public async Task<UserEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyCollection<UserEntity>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _collection.Find(_ => true).ToListAsync(cancellationToken);

    public async Task<UserEntity> CreateAsync(UserEntity user, CancellationToken cancellationToken = default)
    {
        await _collection.InsertOneAsync(user, cancellationToken: cancellationToken);
        return user;
    }

    public async Task<bool> UpdateAsync(string id, UserEntity user, CancellationToken cancellationToken = default)
    {
        user.Id = id;
        var result = await _collection.ReplaceOneAsync(x => x.Id == id, user, cancellationToken: cancellationToken);
        return result.ModifiedCount > 0;
    }

    public async Task<UserEntity?> GetByNameAsync(string username, CancellationToken cancellationToken = default)
        => await _collection.Find(x => x.Phone == username).FirstOrDefaultAsync(cancellationToken);
}
