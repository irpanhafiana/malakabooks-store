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
  public class ComplaintEntityValidator : BaseRepository<ComplaintEntity>, IComplaintEntityValidator
  {
    private IMongoCollection<ComplaintEntity> _collection;

    public ComplaintEntityValidator(MongoDbContext mongoDbContext, IMongoClient mongoClient, IHttpContextAccessor contextAccessor, IOptions<MongoDbSetting> mongoDbSetting) : base(mongoDbContext, mongoClient, contextAccessor)
    {
      _collection = mongoDbContext.GetCollection<ComplaintEntity>(mongoDbSetting.Value.ComplaintsCollection);
    }

    public async Task<ValidationResult> CreateValidateAsync(params ComplaintEntity[] entities)
    {
      foreach (var entity in entities)
      {
        var existing = await _collection.Find(_ =>
          _.UserId == entity.UserId &&
          _.OrderId == entity.OrderId).FirstOrDefaultAsync();

        if (existing != null) Errors.Add("Complaint with same user and order already exist.");
      }

      return GetErrorResult();
    }

    public async Task<ValidationResult> UpdateValidateAsync(params ComplaintEntity[] entities)
    {
      foreach (var entity in entities)
      {
        var existing = await _collection.Find(_ =>

            _.UserId == entity.UserId &&
            _.OrderId == entity.OrderId &&
            _.Alias!.Equals(entity.Alias, StringComparison.CurrentCultureIgnoreCase)
          ).FirstOrDefaultAsync();

        if (existing != null) Errors.Add("Complaint with same user and order already exist.");
      }

      return GetErrorResult();
    }

  }
}
