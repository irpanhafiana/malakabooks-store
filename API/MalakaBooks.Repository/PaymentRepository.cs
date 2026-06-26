using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.Repository.Configuration;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace MalakaBooks.Repository;

public class PaymentRepository : IPaymentRepository
{
    private readonly IMongoCollection<PaymentEntity> _collection;

    public PaymentRepository(IMongoDatabase database, IOptions<MongoDbSetting> mongoDbSetting)
    {
        _collection = database.GetCollection<PaymentEntity>(mongoDbSetting.Value.PaymentsCollection);
    }

    public async Task<IReadOnlyCollection<PaymentEntity>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _collection.Find(Builders<PaymentEntity>.Filter.Empty).ToListAsync(cancellationToken);

    public async Task<PaymentEntity?> GetByIdAsync(string id, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync(cancellationToken);

    public async Task<PaymentEntity> CreateAsync(PaymentEntity payment, CancellationToken cancellationToken = default)
    {
        await _collection.InsertOneAsync(payment, cancellationToken: cancellationToken);
        return payment;
    }

    public async Task<bool> UpdateAsync(string id, PaymentEntity payment, CancellationToken cancellationToken = default)
    {
        payment.Id = id;
        var result = await _collection.ReplaceOneAsync(x => x.Id == id, payment, cancellationToken: cancellationToken);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var result = await _collection.DeleteOneAsync(x => x.Id == id, cancellationToken);
        return result.DeletedCount > 0;
    }
}
