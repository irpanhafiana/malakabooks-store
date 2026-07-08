using MalakaBooks.Entity;
using MalakaBooks.IDataValidator;
using MalakaBooks.IRepository;
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
        private readonly IMongoCollection<ReviewEntity> _collection;
        private readonly IOrderRepository _orderRepository;
        private readonly IReviewRepository _reviewRepository;

        public ReviewEntityValidator(
            MongoDbContext mongoDbContext,
            IMongoClient mongoClient,
            IHttpContextAccessor contextAccessor,
            IOptions<MongoDbSetting> mongoDbSetting,
            IOrderRepository orderRepository,
            IReviewRepository reviewRepository) : base(mongoDbContext, mongoClient, contextAccessor)
        {
            _collection = mongoDbContext.GetCollection<ReviewEntity>(mongoDbSetting.Value.ReviewsCollection);
            _orderRepository = orderRepository;
            _reviewRepository = reviewRepository;
        }

        public async Task<ValidationResult> CreateValidateAsync(params ReviewEntity[] entities)
        {
            foreach (var entity in entities)
            {
                await ValidateReviewAsync(entity, isUpdate: false);
            }

            return GetErrorResult();
        }

        public async Task<ValidationResult> UpdateValidateAsync(params ReviewEntity[] entities)
        {
            foreach (var entity in entities)
            {
                await ValidateReviewAsync(entity, isUpdate: true);
            }

            return GetErrorResult();
        }

        private async Task ValidateReviewAsync(ReviewEntity entity, bool isUpdate)
        {
            var userId = entity.UserId.Trim();
            var bookId = entity.BookId.Trim();
            var orderId = entity.OrderId.Trim();

            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order is null)
            {
                Errors.Add("Order not found.");
                return;
            }

            if (!string.Equals(order.User.UserId, userId, StringComparison.OrdinalIgnoreCase))
            {
                Errors.Add("Review can only be created for your own order.");
            }

            if (!string.Equals(order.Status, "delivered", StringComparison.OrdinalIgnoreCase))
            {
                Errors.Add("Review can only be created for delivered orders.");
            }

            var purchasedBookExists = order.Items.Any(item => string.Equals(item.BookId, bookId, StringComparison.OrdinalIgnoreCase));
            if (!purchasedBookExists)
            {
                Errors.Add("Review book must exist in the specified order.");
            }

            var existing = isUpdate
                ? await _collection.Find(_ =>
                    _.UserId.ToLower() == userId.ToLower() &&
                    _.BookId.ToLower() == bookId.ToLower() &&
                    _.OrderId.ToLower() == orderId.ToLower() &&
                    _.Id != entity.Id).FirstOrDefaultAsync()
                : await _reviewRepository.GetByUserOrderAndBookAsync(userId, orderId, bookId);

            if (existing != null)
            {
                Errors.Add("Review with same user, order and book already exist.");
            }
        }

    }
}
