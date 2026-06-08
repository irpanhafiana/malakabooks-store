using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.Repository.Configuration;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace MalakaBooks.Repository;

public class ComplaintRepository : IComplaintRepository
{
    private readonly IMongoCollection<ComplaintEntity> _collection;

    public ComplaintRepository(IMongoDatabase database, IOptions<MongoDbSetting> mongoDbSetting)
    {
        _collection = database.GetCollection<ComplaintEntity>(mongoDbSetting.Value.ComplaintsCollection);
    }

    public async Task<ComplaintEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyCollection<ComplaintEntity>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _collection.Find(_ => true).ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<ComplaintEntity>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.UserId == userId).ToListAsync(cancellationToken);

    public async Task<ComplaintEntity> CreateAsync(ComplaintEntity complaint, CancellationToken cancellationToken = default)
    {
        await _collection.InsertOneAsync(complaint, cancellationToken: cancellationToken);
        return complaint;
    }

    public async Task<bool> UpdateAsync(string id, ComplaintEntity complaint, CancellationToken cancellationToken = default)
    {
        complaint.Id = id;
        var result = await _collection.ReplaceOneAsync(x => x.Id == id, complaint, cancellationToken: cancellationToken);
        return result.ModifiedCount > 0;
    }
}
