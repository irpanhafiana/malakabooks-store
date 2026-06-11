using MalakaBooks.Entity;
using MalakaBooks.IDataValidator;
using MalakaBooks.Repository;
using MalakaBooks.Repository.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Subur.Storage.MongoDbProvider;
using System.ComponentModel.DataAnnotations;

namespace MalakaBooks.DataValidator
{
  public class OrderEntityValidator : BaseRepository<OrderEntity>, IOrderEntityValidator
  {
    private IMongoCollection<OrderEntity> _collection;

    public OrderEntityValidator(MongoDbContext mongoDbContext, IMongoClient mongoClient, IHttpContextAccessor contextAccessor, IOptions<MongoDbSetting> mongoDbSetting) : base(mongoDbContext, mongoClient, contextAccessor)
    {
      _collection = mongoDbContext.GetCollection<OrderEntity>(mongoDbSetting.Value.OrdersCollection);
    }

    public async Task<ValidationResult> CreateValidateAsync(params OrderEntity[] entities)
    {
      foreach (var entity in entities)
      {
        var existing = await _collection.Find(_ => _.Id == entity.Id).FirstOrDefaultAsync();
        if (existing != null) Errors.Add("Order with same id already exist.");
      }

      return GetErrorResult();
    }

    public async Task<ValidationResult> UpdateValidateAsync(params OrderEntity[] entities)
    {
      foreach (var entity in entities)
      {
        var existing = await _collection.Find(_ =>
            _.Id == entity.Id
          ).FirstOrDefaultAsync();

        if (existing != null) Errors.Add("Order with same id already exist.");
      }

      return GetErrorResult();
    }

  }
}
