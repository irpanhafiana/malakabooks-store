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
    public class ReviewEntityValidator : BaseRepository<ReviewEntity>, IReviewEntityValidator
    {
        private IMongoCollection<ReviewEntity> _collection;

        public ReviewEntityValidator(MongoDbContext mongoDbContext, IMongoClient mongoClient, IHttpContextAccessor contextAccessor, IOptions<MongoDbSetting> mongoDbSetting) : base(mongoDbContext, mongoClient, contextAccessor)
        {
            _collection = mongoDbContext.GetCollection<ReviewEntity>(mongoDbSetting.Value.ReviewsCollection);
        }

        public async Task<ValidationResult> CreateValidateAsync(params ReviewEntity[] entities)
        {
            foreach (var entity in entities)
            {
                var userId = entity.UserId.ToLower();
                var bookId = entity.BookId.ToLower();
                var orderId = entity.OrderId.ToLower();

                var existing = await _collection.Find(_ =>
                  _.UserId.ToLower() == userId &&
                  _.BookId.ToLower() == bookId &&
                  _.OrderId.ToLower() == orderId).FirstOrDefaultAsync();

                if (existing != null) Errors.Add("Review with same user, order and book already exist.");
            }

            return GetErrorResult();
        }

        public async Task<ValidationResult> UpdateValidateAsync(params ReviewEntity[] entities)
        {
            foreach (var entity in entities)
            {
                var userId = entity.UserId.ToLower();
                var bookId = entity.BookId.ToLower();
                var orderId = entity.OrderId.ToLower();

                var existing = await _collection.Find(_ =>
                  _.UserId.ToLower() == userId &&
                  _.BookId.ToLower() == bookId &&
                  _.OrderId.ToLower() == orderId &&
                  _.Id != entity.Id).FirstOrDefaultAsync();

                if (existing != null) Errors.Add("Review with same user, order and book already exist.");
            }

            return GetErrorResult();
        }

    }
}
