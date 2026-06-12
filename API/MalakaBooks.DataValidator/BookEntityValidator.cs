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
    public class BookEntityValidator : BaseRepository<BookEntity>, IBookEntityValidator
    {
        private IMongoCollection<BookEntity> _collection;

        public BookEntityValidator(MongoDbContext mongoDbContext, IMongoClient mongoClient, IHttpContextAccessor contextAccessor, IOptions<MongoDbSetting> mongoDbSetting) : base(mongoDbContext, mongoClient, contextAccessor)
        {
            _collection = mongoDbContext.GetCollection<BookEntity>(mongoDbSetting.Value.BooksCollection);
        }

        public async Task<ValidationResult> CreateValidateAsync(params BookEntity[] entities)
        {
            foreach (var entity in entities)
            {
                var isbn = entity.Isbn.Trim();

                var existing = await _collection.Find(_ =>
                  _.Isbn.ToLower() == isbn).FirstOrDefaultAsync();

                if (existing != null) Errors.Add("Book with same isbn already exist.");
            }

            return GetErrorResult();
        }

        public async Task<ValidationResult> UpdateValidateAsync(params BookEntity[] entities)
        {
            foreach (var entity in entities)
            {
                var isbn = entity.Isbn.Trim();

                var existing = await _collection.Find(_ =>
                  _.Isbn.ToLower() == isbn &&
                  _.Id != entity.Id
                ).FirstOrDefaultAsync();

                if (existing != null) Errors.Add("Book with same isbn already exist.");
            }

            return GetErrorResult();
        }

    }
}
