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
    public class PromotionBannerEntityValidator : BaseRepository<PromotionBannerEntity>, IPromotionBannerEntityValidator
    {
        private readonly IMongoCollection<PromotionBannerEntity> _collection;

        public PromotionBannerEntityValidator(MongoDbContext mongoDbContext, IMongoClient mongoClient, IHttpContextAccessor contextAccessor, IOptions<MongoDbSetting> mongoDbSetting) : base(mongoDbContext, mongoClient, contextAccessor)
        {
            _collection = mongoDbContext.GetCollection<PromotionBannerEntity>(mongoDbSetting.Value.PromotionBannersCollection);
        }

        public async Task<ValidationResult> CreateValidateAsync(params PromotionBannerEntity[] entities)
        {
            foreach (var entity in entities)
            {
                var title = entity.Title.ToLower();
                var existing = await _collection.Find(x => x.Title.ToLower() == title).FirstOrDefaultAsync();

                if (existing != null)
                {
                    Errors.Add("Promotion banner with same title already exist.");
                }
            }

            return GetErrorResult();
        }

        public async Task<ValidationResult> UpdateValidateAsync(params PromotionBannerEntity[] entities)
        {
            foreach (var entity in entities)
            {
                var title = entity.Title.ToLower();
                var existing = await _collection.Find(x => x.Title.ToLower() == title && x.Id != entity.Id).FirstOrDefaultAsync();

                if (existing != null)
                {
                    Errors.Add("Promotion banner with same title already exist.");
                }
            }

            return GetErrorResult();
        }
    }
}
