using MalakaBooks.Entity;
using MalakaBooks.IRepository;
using MalakaBooks.Repository.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Subur.Storage.MongoDbProvider;

namespace MalakaBooks.Repository;

public class IncomingPaymentRepository : BaseRepository<IncomingPaymentEntity>, IIncomingPaymentRepository
{
    private readonly IMongoCollection<IncomingPaymentEntity> _collection;

    public IncomingPaymentRepository(
        MongoDbContext mongoDbContext,
        IMongoClient mongoClient,
        IHttpContextAccessor contextAccessor,
        IOptions<MongoDbSetting> mongoDbSetting) : base(mongoDbContext, mongoClient, contextAccessor)
    {
        _collection = mongoDbContext.GetCollection<IncomingPaymentEntity>(mongoDbSetting.Value.IncomingPaymentsCollection);
    }

    public async Task<IncomingPaymentEntity?> GetByOrderIdAsync(string orderId, CancellationToken cancellationToken = default) =>
        await _collection.Find(x => x.OrderId == orderId).FirstOrDefaultAsync(cancellationToken);

    public async Task<IncomingPaymentEntity> CreateAsync(IncomingPaymentEntity incomingPayment, CancellationToken cancellationToken = default)
    {
        await _collection.InsertOneAsync(incomingPayment, cancellationToken: cancellationToken);
        return incomingPayment;
    }
}
