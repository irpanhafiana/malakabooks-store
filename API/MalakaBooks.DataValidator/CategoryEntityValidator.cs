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
  public class CategoryEntityValidator : BaseRepository<CategoryEntity>, ICategoryEntityValidator
  {
    private IMongoCollection<CategoryEntity> _collection;

    public CategoryEntityValidator(MongoDbContext mongoDbContext, IMongoClient mongoClient, IHttpContextAccessor contextAccessor, IOptions<MongoDbSetting> mongoDbSetting) : base(mongoDbContext, mongoClient, contextAccessor)
    {
      _collection = mongoDbContext.GetCollection<CategoryEntity>(mongoDbSetting.Value.CategoriesCollection);
    }

    public async Task<ValidationResult> CreateValidateAsync(params CategoryEntity[] entities)
    {
      foreach (var entity in entities)
      {
        var existing = await _collection.Find(_ =>
          _.Name.Equals(entity.Name, StringComparison.CurrentCultureIgnoreCase) ||
          _.Slug.Equals(entity.Slug, StringComparison.CurrentCultureIgnoreCase)).FirstOrDefaultAsync();

        if (existing != null) Errors.Add("Category with same slug or name already exist.");
      }

      return GetErrorResult();
    }

    public async Task<ValidationResult> UpdateValidateAsync(params CategoryEntity[] entities)
    {
      foreach (var entity in entities)
      {
        var existing = await _collection.Find(_ =>
          (
            _.Name.Equals(entity.Name, StringComparison.CurrentCultureIgnoreCase) ||
            _.Slug.Equals(entity.Slug, StringComparison.CurrentCultureIgnoreCase)
          ) &&
            _.Alias!.Equals(entity.Alias, StringComparison.CurrentCultureIgnoreCase)
          ).FirstOrDefaultAsync();

        if (existing != null) Errors.Add("Category with same slug or name already exist.");
      }

      return GetErrorResult();
    }

  }
}
