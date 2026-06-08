using MalakaBooks.Entity;
using MalakaBooks.ViewModel;

namespace MalakaBooks.Mediator.Common;

public static class MappingExtensions
{
  public static BookResponse ToResponse(this BookEntity entity) => new()
  {
    Id = entity.Id ?? string.Empty,
    Title = entity.Title,
    Author = entity.Author,
    Isbn = entity.Isbn,
    CategoryId = entity.CategoryId,
    Price = entity.Price,
    Description = entity.Description,
    CoverImage = entity.CoverImage,
    Publisher = entity.Publisher,
    PublishedYear = entity.PublishedYear,
    Pages = entity.Pages,
    Weight = entity.Weight,
    Stock = entity.Stock,
    AverageRating = entity.AverageRating,
    TotalReviews = entity.TotalReviews,
    CreatedAt = entity.CreatedAt
  };

  public static BookEntity ToEntity(this CreateBookRequest request) => new()
  {
    Title = request.Title.Trim(),
    Author = request.Author.Trim(),
    Isbn = request.Isbn.Trim(),
    CategoryId = request.CategoryId.Trim(),
    Price = request.Price,
    Description = request.Description.Trim(),
    CoverImage = request.CoverImage.Trim(),
    Publisher = request.Publisher.Trim(),
    PublishedYear = request.PublishedYear,
    Pages = request.Pages,
    Weight = request.Weight,
    Stock = request.Stock,
    AverageRating = 0,
    TotalReviews = 0,
    CreatedAt = DateTime.UtcNow
  };

  public static void UpdateFrom(this BookEntity entity, UpdateBookRequest request)
  {
    entity.Title = request.Title.Trim();
    entity.Author = request.Author.Trim();
    entity.Isbn = request.Isbn.Trim();
    entity.CategoryId = request.CategoryId.Trim();
    entity.Price = request.Price;
    entity.Description = request.Description.Trim();
    entity.CoverImage = request.CoverImage.Trim();
    entity.Publisher = request.Publisher.Trim();
    entity.PublishedYear = request.PublishedYear;
    entity.Pages = request.Pages;
    entity.Weight = request.Weight;
    entity.Stock = request.Stock;
  }

  public static CategoryResponse ToResponse(this CategoryEntity entity) => new()
  {
    Id = entity.Id ?? string.Empty,
    Name = entity.Name,
    Slug = entity.Slug,
    Description = entity.Description,
    Icon = entity.Icon
  };

  public static CategoryEntity ToEntity(this CreateCategoryRequest request) => new()
  {
    Name = request.Name.Trim(),
    Slug = request.Slug.Trim(),
    Description = request.Description.Trim(),
    Icon = request.Icon.Trim()
  };

  public static void UpdateFrom(this CategoryEntity entity, UpdateCategoryRequest request)
  {
    entity.Name = request.Name.Trim();
    entity.Slug = request.Slug.Trim();
    entity.Description = request.Description.Trim();
    entity.Icon = request.Icon.Trim();
  }

  public static OrderItemResponse ToResponse(this OrderItemEntity entity) => new()
  {
    BookId = entity.BookId,
    Title = entity.Title,
    Price = entity.Price,
    Quantity = entity.Quantity
  };

  public static OrderItemEntity ToEntity(this CreateOrderItemRequest request) => new()
  {
    BookId = request.BookId.Trim(),
    Title = request.Title.Trim(),
    Price = request.Price,
    Quantity = request.Quantity
  };

  public static OrderResponse ToResponse(this OrderEntity entity) => new()
  {
    Id = entity.Id ?? string.Empty,
    UserId = entity.UserId,
    Items = entity.Items.Select(ToResponse).ToList(),
    AddressId = entity.AddressId,
    Status = entity.Status,
    TotalPrice = entity.TotalPrice,
    Note = entity.Note,
    CreatedAt = entity.CreatedAt,
    UpdatedAt = entity.UpdatedAt
  };

  public static OrderEntity ToEntity(this CreateOrderRequest request) => new()
  {
    UserId = request.UserId.Trim(),
    AddressId = request.AddressId.Trim(),
    Items = request.Items.Select(ToEntity).ToList(),
    TotalPrice = request.Items.Sum(item => item.Price * item.Quantity),
    Note = request.Note.Trim(),
    Status = "pending",
    CreatedAt = DateTime.UtcNow,
    UpdatedAt = DateTime.UtcNow
  };

  public static CartItemResponse ToResponse(this CartItemEntity entity) => new()
  {
    BookId = entity.BookId,
    Quantity = entity.Quantity
  };

  public static CartItemEntity ToEntity(this AddCartItemRequest request) => new()
  {
    BookId = request.BookId.Trim(),
    Quantity = request.Quantity
  };

  public static CartResponse ToResponse(this IEnumerable<CartItemEntity> items, string userId) => new()
  {
    UserId = userId,
    Items = items.Select(ToResponse).ToList()
  };

  public static AddressResponse ToResponse(this AddressEntity entity) => new()
  {
    Id = entity.Id ?? string.Empty,
    UserId = entity.UserId,
    Label = entity.Label,
    RecipientName = entity.RecipientName,
    Phone = entity.Phone,
    Street = entity.Street,
    City = entity.City,
    Province = entity.Province,
    PostalCode = entity.PostalCode,
    IsDefault = entity.IsDefault
  };

  public static AddressEntity ToEntity(this CreateAddressRequest request) => new()
  {
    UserId = request.UserId.Trim(),
    Label = request.Label.Trim(),
    RecipientName = request.RecipientName.Trim(),
    Phone = request.Phone.Trim(),
    Street = request.Street.Trim(),
    City = request.City.Trim(),
    Province = request.Province.Trim(),
    PostalCode = request.PostalCode.Trim(),
    IsDefault = request.IsDefault
  };

  public static void UpdateFrom(this AddressEntity entity, UpdateAddressRequest request)
  {
    entity.UserId = request.UserId.Trim();
    entity.Label = request.Label.Trim();
    entity.RecipientName = request.RecipientName.Trim();
    entity.Phone = request.Phone.Trim();
    entity.Street = request.Street.Trim();
    entity.City = request.City.Trim();
    entity.Province = request.Province.Trim();
    entity.PostalCode = request.PostalCode.Trim();
    entity.IsDefault = request.IsDefault;
  }

  public static UserResponse ToResponse(this UserEntity entity) => new()
  {
    Id = entity.Id ?? string.Empty,
    Name = entity.Name,
    Phone = entity.Phone,
    Avatar = entity.Avatar,
    CreatedAt = entity.CreatedAt
  };

  public static void UpdateFrom(this UserEntity entity, UpdateUserRequest request)
  {
    entity.Name = request.Name.Trim();
    entity.Phone = request.Phone.Trim();
    entity.Avatar = request.Avatar.Trim();
  }

  public static ReviewResponse ToResponse(this ReviewEntity entity) => new()
  {
    Id = entity.Id ?? string.Empty,
    UserId = entity.UserId,
    BookId = entity.BookId,
    OrderId = entity.OrderId,
    Rating = entity.Rating,
    Comment = entity.Comment,
    CreatedAt = entity.CreatedAt
  };

  public static ReviewEntity ToEntity(this CreateReviewRequest request) => new()
  {
    UserId = request.UserId.Trim(),
    BookId = request.BookId.Trim(),
    OrderId = request.OrderId.Trim(),
    Rating = request.Rating,
    Comment = request.Comment.Trim(),
    CreatedAt = DateTime.UtcNow
  };

  public static ComplaintResponse ToResponse(this ComplaintEntity entity) => new()
  {
    Id = entity.Id ?? string.Empty,
    UserId = entity.UserId,
    OrderId = entity.OrderId,
    Subject = entity.Subject,
    Description = entity.Description,
    Status = entity.Status,
    AdminResponse = entity.AdminResponse,
    CreatedAt = entity.CreatedAt,
    UpdatedAt = entity.UpdatedAt
  };

  public static ComplaintEntity ToEntity(this CreateComplaintRequest request) => new()
  {
    UserId = request.UserId.Trim(),
    OrderId = request.OrderId.Trim(),
    Subject = request.Subject.Trim(),
    Description = request.Description.Trim(),
    Status = "open",
    AdminResponse = string.Empty,
    CreatedAt = DateTime.UtcNow,
    UpdatedAt = DateTime.UtcNow
  };

  public static void UpdateFrom(this ComplaintEntity entity, RespondComplaintRequest request)
  {
    entity.Status = request.Status.Trim();
    entity.AdminResponse = request.AdminResponse.Trim();
    entity.UpdatedAt = DateTime.UtcNow;
  }
}
