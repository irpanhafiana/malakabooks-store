using MalakaBooks.Entity;
using MalakaBooks.ViewModel;
using Mardika.Simasrim.Service.Model;
using System.Text.Json;

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
        CreatedAt = entity.CreatedAt,
        AdditionalImages = entity.AdditionalImages.Select(ToResponse).ToList()
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
        AdditionalImages = request.AdditionalImages.Select(ToEntity).ToList(),
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
        entity.AdditionalImages = request.AdditionalImages.Select(ToEntity).ToList();
    }

    public static AdditionalImageRequest ToResponse(this AdditionalImage entity) => new()
    {
        No = entity.No,
        Image = entity.Image
    };

    public static AdditionalImage ToEntity(this AdditionalImageRequest request) => new()
    {
        No = request.No,
        Image = request.Image.Trim()
    };

    public static CategoryResponse ToResponse(this CategoryEntity entity) => new()
    {
        Id = entity.Id ?? string.Empty,
        Name = entity.Name,
        Slug = entity.Slug,
        Description = entity.Description,
        Icon = entity.Icon,
        Alias = entity.Alias!
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
        BookName = request.BookName.Trim(),
        Title = request.Title.Trim(),
        Price = request.Price,
        Quantity = request.Quantity
    };

    public static OrderShipmentDetail? ToShipmentDetail(this SimasrimCreateResiRequest? request) => request is null
        ? null
        : new OrderShipmentDetail
        {
            Courier = request.Courier,
            PickupName = request.PickupName,
            PickupDate = request.PickupDate,
            PickupPhoneNumber = request.PickupPhoneNumber,
            PickupAddress = request.PickupAddress,
            PickupAddressId = request.PickupAddressId,
            SenderName = request.SenderName,
            SenderAddress = request.SenderAddress,
            SenderAddressId = request.SenderAddressId,
            SenderPhoneNumber = request.SenderPhoneNumber,
            ReceiverName = request.ReceiverName,
            ReceiverAddress = request.ReceiverAddress,
            ReceiverAddressId = request.ReceiverAddressId,
            ReceiverPhoneNumber = request.ReceiverPhoneNumber,
            Type = request.Type,
            ItemWeight = request.ItemWeight,
            ServiceType = request.ServiceType,
            ServicePrice = request.ServicePrice.ToString(),
            ServiceEstimate = request.ServiceEstimate,
            Quantity = request.Quantity,
            WoodenPacking = request.WoodenPacking,
            Insurance = request.Insurance,
            ItemValueAmount = request.ItemValue,
            ItemType = request.ItemType,
            Volume = request.Volume,
            ItemName = request.ItemName,
            CourierInstruction = request.CourierInstruction,
            PickupZipCode = request.PickupZipCode,
            ReceiverZipCode = request.ReceiverZipCode,
            SenderLongitude = request.SenderLongitude,
            SenderLatitude = request.SenderLatitude,
            ReceiverLongitude = request.ReceiverLongitude,
            ReceiverLatitude = request.ReceiverLatitude,
            ItemCode = request.ItemCode,
            ItemCategory = request.ItemCategory,
            IsFragile = request.IsFragile,
            Size = request.Size,
            PickupServiceType = request.PickupServiceType,
            PickupVehicleType = request.PickupVehicleType,
            ReceiverNote = request.ReceiverNote,
            Bpik = request.Bpik?.Select(item => new OrderShipmentBpikDetail
            {
                ItemValue = item.ItemValue,
                ItemType = item.ItemType,
                SerialNumber = item.SerialNumber,
                InsuranceAmount = item.InsuranceAmount,
                Color = item.Color,
                Condition = item.Condition
            }).ToList(),
            PartnerName = request.PartnerName
        };

    public static SimasrimCreateResiRequest ToSimasrimRequest(this OrderShipmentDetail detail) => new()
    {
        Courier = detail.Courier,
        PickupName = detail.PickupName,
        PickupDate = detail.PickupDate,
        PickupPhoneNumber = detail.PickupPhoneNumber,
        PickupAddress = detail.PickupAddress,
        PickupAddressId = detail.PickupAddressId,
        SenderName = detail.SenderName,
        SenderAddress = detail.SenderAddress,
        SenderAddressId = detail.SenderAddressId,
        SenderPhoneNumber = detail.SenderPhoneNumber,
        ReceiverName = detail.ReceiverName,
        ReceiverAddress = detail.ReceiverAddress,
        ReceiverAddressId = detail.ReceiverAddressId,
        ReceiverPhoneNumber = detail.ReceiverPhoneNumber,
        Type = detail.Type,
        ItemWeight = detail.ItemWeight,
        ServiceType = detail.ServiceType,
        ServicePrice = detail.ServicePrice,
        ServiceEstimate = detail.ServiceEstimate,
        Quantity = detail.Quantity,
        WoodenPacking = detail.WoodenPacking,
        Insurance = detail.Insurance,
        ItemValue = detail.ItemValueAmount,
        ItemType = detail.ItemType,
        Volume = detail.Volume,
        ItemName = detail.ItemName,
        CourierInstruction = detail.CourierInstruction,
        PickupZipCode = detail.PickupZipCode,
        ReceiverZipCode = detail.ReceiverZipCode,
        SenderLongitude = detail.SenderLongitude,
        SenderLatitude = detail.SenderLatitude,
        ReceiverLongitude = detail.ReceiverLongitude,
        ReceiverLatitude = detail.ReceiverLatitude,
        ItemCode = detail.ItemCode,
        ItemCategory = detail.ItemCategory,
        IsFragile = detail.IsFragile,
        Size = detail.Size,
        PickupServiceType = detail.PickupServiceType,
        PickupVehicleType = detail.PickupVehicleType,
        ReceiverNote = detail.ReceiverNote,
        Bpik = detail.Bpik?.Select(item => new SimasrimBpikRequest
        {
            ItemValue = item.ItemValue,
            ItemType = item.ItemType,
            SerialNumber = item.SerialNumber,
            InsuranceAmount = item.InsuranceAmount,
            Color = item.Color,
            Condition = item.Condition
        }).ToList(),
        PartnerName = string.IsNullOrWhiteSpace(detail.PartnerName) ? "SIMASRIM" : detail.PartnerName,
        ReferenceNo = detail.ReferenceNo
    };

    public static string ToShipmentDetailJson(this OrderShipmentDetail? detail) => detail is null
        ? string.Empty
        : JsonSerializer.Serialize(detail);

    public static OrderShipmentDetail? ToShipmentDetail(this string? shipmentDetailJson)
    {
        if (string.IsNullOrWhiteSpace(shipmentDetailJson))
        {
            return null;
        }

        return JsonSerializer.Deserialize<OrderShipmentDetail>(shipmentDetailJson);
    }

    public static OrderUserResponse ToResponse(this OrderUserEntity entity) => new()
    {
        UserId = entity.UserId,
        FirstName = entity.FirstName,
        LastName = entity.LastName,
        Phone = entity.Phone
    };

    public static OrderUserEntity ToEntity(this UserEntity entity) => new()
    {
        UserId = entity.UserId.Trim(),
        FirstName = entity.FirstName.Trim(),
        LastName = entity.LastName.Trim(),
        Phone = entity.Phone.Trim()
    };

    public static OrderResponse ToResponse(this OrderEntity entity) => new()
    {
        Id = entity.Id ?? string.Empty,
        User = entity.User.ToResponse(),
        Items = entity.Items.Select(ToResponse).ToList(),
        AddressId = entity.AddressId,
        Status = entity.Status,
        PaymentStatus = entity.PaymentStatus,
        PaymentMethod = entity.PaymentMethod,
        PaymentGateway = entity.PaymentGateway,
        PaymentUrl = entity.PaymentUrl,
        IncomingPaymentId = entity.IncomingPaymentId ?? string.Empty,
        ItemsSubtotal = entity.ItemsSubtotal,
        ShippingFee = entity.ShippingFee,
        GrandTotal = entity.GrandTotal,
        TotalPrice = entity.TotalPrice,
        Note = entity.Note,

        ShippingCourier = entity.ShippingCourier,
        ShippingEst = entity.ShippingEst,
        ShippingType = entity.ShippingType,
        AWBNo = entity.AWBNo,

        ShipmentRetryCount = entity.ShipmentRetryCount,
        ShipmentLastError = entity.ShipmentLastError,
        ShipmentCreatedAt = entity.ShipmentCreatedAt,
        ShipmentLastAttemptAt = entity.ShipmentLastAttemptAt,
        PaidAt = entity.PaidAt,
        ExpiresAt = entity.ExpiresAt,
        CreatedAt = entity.CreatedAt,
        UpdatedAt = entity.UpdatedAt
    };

    public static AdminOrderResponse ToAdminResponse(this OrderEntity entity) => new()
    {
        Id = entity.Id ?? string.Empty,
        User = entity.User.ToResponse(),
        Items = entity.Items.Select(ToResponse).ToList(),
        AddressId = entity.AddressId,
        Status = entity.Status,
        PaymentStatus = entity.PaymentStatus,
        PaymentMethod = entity.PaymentMethod,
        PaymentGateway = entity.PaymentGateway,
        PaymentUrl = entity.PaymentUrl,
        IncomingPaymentId = entity.IncomingPaymentId ?? string.Empty,
        ItemsSubtotal = entity.ItemsSubtotal,
        ShippingFee = entity.ShippingFee,
        GrandTotal = entity.GrandTotal,
        TotalPrice = entity.TotalPrice,
        Note = entity.Note,

        ShippingCourier = entity.ShippingCourier,
        ShippingEst = entity.ShippingEst,
        ShippingType = entity.ShippingType,
        AWBNo = entity.AWBNo,

        ShipmentDetail = entity.ShipmentDetailJson.ToShipmentDetail(),

        ShipmentRetryCount = entity.ShipmentRetryCount,
        ShipmentLastError = entity.ShipmentLastError,
        ShipmentCreatedAt = entity.ShipmentCreatedAt,
        ShipmentLastAttemptAt = entity.ShipmentLastAttemptAt,
        PaidAt = entity.PaidAt,
        ExpiresAt = entity.ExpiresAt,
        CreatedAt = entity.CreatedAt,
        UpdatedAt = entity.UpdatedAt
    };

    public static OrderEntity ToEntity(this CreateOrderRequest request, UserEntity user)
    {
        var itemsSubtotal = request.Items.Sum(item => item.Price * item.Quantity);
        var shippingFee = request.ShippingFee;

        return new OrderEntity
        {
            User = user.ToEntity(),
            AddressId = request.AddressId.Trim(),
            Items = request.Items.Select(ToEntity).ToList(),
            ItemsSubtotal = itemsSubtotal,
            ShippingFee = shippingFee,
            ShippingType = request.ShippingType,
            ShippingEst = request.ShippingEst,
            ShippingCourier = request.ShippingCourier,
            GrandTotal = itemsSubtotal + shippingFee,
            TotalPrice = itemsSubtotal + shippingFee,
            Note = request.Note.Trim(),

            ShipmentRetryCount = 0,
            ShipmentLastError = string.Empty,
            ShipmentCreatedAt = null,
            ShipmentLastAttemptAt = null,
            Status = "pending_payment",
            PaymentStatus = "unpaid",
            PaymentMethod = string.Empty,
            PaymentGateway = string.Empty,
            PaymentUrl = string.Empty,
            IncomingPaymentId = null,
            ExpiresAt = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

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
        Province = entity.Province,
        City = entity.City,
        District = entity.District,
        SubDistrict = entity.SubDistrict,
        PostalCode = entity.PostalCode,
        Longitude = entity.Longitude,
        Latitude = entity.Latitude,
        IsDefault = entity.IsDefault,
        AddressCode = entity.AddressCode
    };

    public static HomeAddressEntity ToEntity(this CreateHomeAddressRequest request) => new()
    {
        Label = request.Label.Trim(),
        RecipientName = request.RecipientName.Trim(),
        Phone = request.Phone.Trim(),
        Street = request.Street.Trim(),
        Province = request.Province.Trim(),
        City = request.City.Trim(),
        District = request.District.Trim(),
        SubDistrict = request.SubDistrict.Trim(),
        PostalCode = request.PostalCode.Trim(),
        Longitude = request.Longitude,
        Latitude = request.Latitude,
        AddressCode = request.AddressCode.Trim()
    };

    public static void UpdateFrom(this HomeAddressEntity entity, UpdateHomeAddressRequest request)
    {
        entity.Label = request.Label.Trim();
        entity.RecipientName = request.RecipientName.Trim();
        entity.Phone = request.Phone.Trim();
        entity.Street = request.Street.Trim();
        entity.Province = request.Province.Trim();
        entity.City = request.City.Trim();
        entity.District = request.District.Trim();
        entity.SubDistrict = request.SubDistrict.Trim();
        entity.PostalCode = request.PostalCode.Trim();
        entity.Longitude = request.Longitude;
        entity.Latitude = request.Latitude;
        entity.AddressCode = request.AddressCode.Trim();
    }

    public static AddressEntity ToEntity(this CreateAddressRequest request) => new()
    {
        UserId = request.UserId.Trim(),
        Label = request.Label.Trim(),
        RecipientName = request.RecipientName.Trim(),
        Phone = request.Phone.Trim(),
        Street = request.Street.Trim(),
        Province = request.Province.Trim(),
        City = request.City.Trim(),
        District = request.District.Trim(),
        SubDistrict = request.SubDistrict.Trim(),
        PostalCode = request.PostalCode.Trim(),
        Longitude = request.Longitude,
        Latitude = request.Latitude,
        IsDefault = request.IsDefault,
        AddressCode = request.AddressCode.Trim(),
    };

    public static void UpdateFrom(this AddressEntity entity, UpdateAddressRequest request)
    {
        entity.UserId = request.UserId.Trim();
        entity.Label = request.Label.Trim();
        entity.RecipientName = request.RecipientName.Trim();
        entity.Phone = request.Phone.Trim();
        entity.Street = request.Street.Trim();
        entity.Province = request.Province.Trim();
        entity.City = request.City.Trim();
        entity.District = request.District.Trim();
        entity.SubDistrict = request.SubDistrict.Trim();
        entity.PostalCode = request.PostalCode.Trim();
        entity.Longitude = request.Longitude;
        entity.Latitude = request.Latitude;
        entity.IsDefault = request.IsDefault;
        entity.AddressCode = request.AddressCode.Trim();
    }

    public static UserResponse ToResponse(this UserEntity entity) => new()
    {
        Id = entity.Id ?? string.Empty,
        FirstName = entity.FirstName,
        LastName = entity.LastName,
        Phone = entity.Phone,
        Avatar = entity.Avatar,
        CreatedAt = entity.CreatedAt
    };

    public static void UpdateFrom(this UserEntity entity, UpdateUserRequest request)
    {
        entity.FirstName = request.FirstName.Trim();
        entity.LastName = request.LastName.Trim();
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
        UpdatedAt = entity.UpdatedAt,
        AdditionalImages = entity.AdditionalImages.Select(ToResponse).ToList()
    };

    public static ComplaintEntity ToEntity(this CreateComplaintRequest request) => new()
    {
        UserId = request.UserId.Trim(),
        OrderId = request.OrderId.Trim(),
        Subject = request.Subject.Trim(),
        Description = request.Description.Trim(),
        AdditionalImages = request.AdditionalImages.Select(ToEntity).ToList(),
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

    public static HomeAddressResponse ToHomeResponse(this HomeAddressEntity entity) => new()
    {
        Id = entity.Id ?? string.Empty,
        Label = entity.Label,
        RecipientName = entity.RecipientName,
        Phone = entity.Phone,
        Street = entity.Street,
        Province = entity.Province,
        City = entity.City,
        District = entity.District,
        SubDistrict = entity.SubDistrict,
        PostalCode = entity.PostalCode,
        Longitude = entity.Longitude,
        Latitude = entity.Latitude,
        AddressCode = entity.AddressCode
    };
}
