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
  public class AddressEntityValidator : BaseRepository<AddressEntity>, IAddressEntityValidator
  {
    private IMongoCollection<AddressEntity> _collection;

    public AddressEntityValidator(MongoDbContext mongoDbContext, IMongoClient mongoClient, IHttpContextAccessor contextAccessor, IOptions<MongoDbSetting> mongoDbSetting) : base(mongoDbContext, mongoClient, contextAccessor)
    {
      _collection = mongoDbContext.GetCollection<AddressEntity>(mongoDbSetting.Value.AddressesCollection);
    }

    public async Task<ValidationResult> CreateValidateAsync(params AddressEntity[] entities)
    {
      foreach (var entity in entities)
      {
        var existing = await _collection.Find(_ =>
          _.UserId.Equals(entity.UserId, StringComparison.CurrentCultureIgnoreCase) &&
          _.Label.Equals(entity.Label, StringComparison.CurrentCultureIgnoreCase)
        ).FirstOrDefaultAsync();

        if (existing != null) Errors.Add("Address with same label already exist.");
      }

      return GetErrorResult();
    }

    public async Task<ValidationResult> UpdateValidateAsync(params AddressEntity[] entities)
    {
      foreach (var entity in entities)
      {
        var existing = await _collection.Find(_ =>
          _.UserId.Equals(entity.UserId, StringComparison.CurrentCultureIgnoreCase) &&
          _.Label.Equals(entity.Label, StringComparison.CurrentCultureIgnoreCase) &&
          _.Alias!.Equals(entity.Alias, StringComparison.CurrentCultureIgnoreCase)
        ).FirstOrDefaultAsync();

        if (existing != null) Errors.Add("Address with same label already exist.");
      }

      return GetErrorResult();
    }

  }
}
