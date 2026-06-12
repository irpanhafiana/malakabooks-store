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
                var name = entity.Name.ToLower();
                var slug = entity.Slug.ToLower();

                var existing = await _collection.Find(x => x.Name.ToLower() == name || x.Slug.ToLower() == slug).FirstOrDefaultAsync();

                if (existing != null) Errors.Add("Category with same slug or name already exist.");
            }

            return GetErrorResult();
        }

        public async Task<ValidationResult> UpdateValidateAsync(params CategoryEntity[] entities)
        {
            foreach (var entity in entities)
            {
                var name = entity.Name.ToLower();
                var slug = entity.Slug.ToLower();

                var existing = await _collection.Find(x =>
                    (x.Name.ToLower() == name || x.Slug.ToLower() == slug) &&
                    x.Id != entity.Id
                ).FirstOrDefaultAsync();

                if (existing != null) Errors.Add("Category with same slug or name already exist.");
            }

            return GetErrorResult();
        }

    }
}
