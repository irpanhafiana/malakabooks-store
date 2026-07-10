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
                var userId = entity.UserId.ToLower();
                var orderId = entity.OrderId.ToLower();
                var bookId = entity.BookId.ToLower();

                var existing = await _collection.Find(_ =>
                  _.UserId.ToLower() == userId &&
                  _.OrderId.ToLower() == orderId &&
                  _.BookId.ToLower() == bookId).FirstOrDefaultAsync();

                if (existing != null) Errors.Add("Complaint with same user, order, and book already exist.");
            }

            return GetErrorResult();
        }

        public async Task<ValidationResult> UpdateValidateAsync(params ComplaintEntity[] entities)
        {
            foreach (var entity in entities)
            {
                var userId = entity.UserId.ToLower();
                var orderId = entity.OrderId.ToLower();
                var bookId = entity.BookId.ToLower();

                var existing = await _collection.Find(_ =>
                  _.UserId.ToLower() == userId &&
                  _.OrderId.ToLower() == orderId &&
                  _.BookId.ToLower() == bookId &&
                  _.Id != entity.Id).FirstOrDefaultAsync();

                if (existing != null) Errors.Add("Complaint with same user, order, and book already exist.");
            }

            return GetErrorResult();
        }

    }
}
