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
  public class UserEntityValidator : BaseRepository<UserEntity>, IUserEntityValidator
  {
    private IMongoCollection<UserEntity> _collection;

    public UserEntityValidator(MongoDbContext mongoDbContext, IMongoClient mongoClient, IHttpContextAccessor contextAccessor, IOptions<MongoDbSetting> mongoDbSetting) : base(mongoDbContext, mongoClient, contextAccessor)
    {
      _collection = mongoDbContext.GetCollection<UserEntity>(mongoDbSetting.Value.UsersCollection);
    }

    public async Task<ValidationResult> CreateValidateAsync(params UserEntity[] entities)
    {
      foreach (var entity in entities)
      {
        var existing = await _collection.Find(_ =>
          _.Phone.Equals(entity.Phone, StringComparison.CurrentCultureIgnoreCase)).FirstOrDefaultAsync();

        if (existing != null) Errors.Add("User already exist.");
      }

      return GetErrorResult();
    }

    public async Task<ValidationResult> UpdateValidateAsync(params UserEntity[] entities)
    {
      foreach (var entity in entities)
      {
        var existing = await _collection.Find(_ =>
          _.Phone.Equals(entity.Phone, StringComparison.CurrentCultureIgnoreCase) &&
            _.Alias!.Equals(entity.Alias, StringComparison.CurrentCultureIgnoreCase)
          ).FirstOrDefaultAsync();

        if (existing != null) Errors.Add("User already exist.");
      }

      return GetErrorResult();
    }

  }
}
