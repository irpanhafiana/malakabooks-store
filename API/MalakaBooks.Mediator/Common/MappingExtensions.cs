using MalakaBooks.Entity;
using MalakaBooks.ViewModel;
using Mardika.Simasrim.Service.Model;
using System.Text.Json;

namespace MalakaBooks.Mediator.Common;

public static class MappingExtensions
{
    public static ItemResponse ToResponse(this ItemEntity entity, UomGroupEntity? uomGroup = null, ItemMetadataResponse? metadata = null) => new()
    {
        Id = entity.Id ?? string.Empty,
        Name = entity.Name,
        SAPCode = entity.SAPCode,
        ItemType = entity.ItemType,
        CategoryId = entity.CategoryId,
        CoverImage = entity.CoverImage,
        AdditionalImages = entity.AdditionalImages.Select(ToResponse).ToList(),
        UomGroupId = entity.UomGroupId,
        UomGroup = uomGroup?.ToResponse(),
        BaseUomCode = entity.BaseUomCode,
        Description = entity.Description,
        Weight = entity.Weight,
        Stock = entity.Stock,
        IsActive = entity.IsActive,
        Metadata = metadata,
        CreatedAt = entity.CreatedAt,
        UpdatedAt = entity.UpdatedAt
    };

    public static ItemMetadataResponse ToMetadataResponse(this BookEntity entity, IEnumerable<AuthorEntity>? authors = null) => new()
    {
        Book = new BookItemMetadataResponse
        {
            Id = entity.Id ?? string.Empty,
            Isbn = entity.Isbn,
            Authors = (authors ?? []).Select(ToMetadataResponse).ToList(),
            Publisher = entity.Publisher,
            PublishedYear = entity.PublishedYear,
            Pages = entity.Pages
        }
    };

    public static ItemMetadataAuthorResponse ToMetadataResponse(this AuthorEntity entity) => new()
    {
        Id = entity.Id ?? string.Empty,
        Name = entity.Name
    };

    public static ItemEntity ToEntity(this CreateItemRequest request) => new()
    {
        Name = request.Name.Trim(),
        SAPCode = request.SAPCode.Trim(),
        ItemType = request.ItemType.Trim(),
        CategoryId = string.IsNullOrWhiteSpace(request.CategoryId) ? null : request.CategoryId.Trim(),
        CoverImage = request.CoverImage.Trim(),
        AdditionalImages = request.AdditionalImages.Select(ToEntity).ToList(),
        UomGroupId = string.IsNullOrWhiteSpace(request.UomGroupId) ? null : request.UomGroupId.Trim(),
        BaseUomCode = request.BaseUomCode.Trim(),
        Description = request.Description.Trim(),
        Weight = request.Weight,
        Stock = request.Stock,
        IsActive = request.IsActive,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    public static ItemEntity ToEntity(this CreateItemWithFilesRequest request, string coverImageUrl, List<string> additionalImageUrls) => new()
    {
        Name = request.Name.Trim(),
        SAPCode = request.SAPCode.Trim(),
        ItemType = request.ItemType.Trim(),
        CategoryId = string.IsNullOrWhiteSpace(request.CategoryId) ? null : request.CategoryId.Trim(),
        CoverImage = coverImageUrl,
        AdditionalImages = additionalImageUrls.Select((url, index) => new AdditionalImage { No = index + 1, Image = url }).ToList(),
        UomGroupId = string.IsNullOrWhiteSpace(request.UomGroupId) ? null : request.UomGroupId.Trim(),
        BaseUomCode = request.BaseUomCode.Trim(),
        Description = request.Description.Trim(),
        Weight = request.Weight,
        Stock = request.Stock,
        IsActive = request.IsActive,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    public static void UpdateFrom(this ItemEntity entity, UpdateItemRequest request)
    {
        entity.Name = request.Name.Trim();
        entity.SAPCode = request.SAPCode.Trim();
        entity.ItemType = request.ItemType.Trim();
        entity.CategoryId = string.IsNullOrWhiteSpace(request.CategoryId) ? null : request.CategoryId.Trim();
        entity.CoverImage = request.CoverImage.Trim();
        entity.AdditionalImages = request.AdditionalImages.Select(ToEntity).ToList();
        entity.UomGroupId = string.IsNullOrWhiteSpace(request.UomGroupId) ? null : request.UomGroupId.Trim();
        entity.BaseUomCode = request.BaseUomCode.Trim();
        entity.Description = request.Description.Trim();
        entity.Weight = request.Weight;
        entity.Stock = request.Stock;
        entity.IsActive = request.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;
    }

    public static void UpdateFrom(this ItemEntity entity, UpdateItemWithFilesRequest request, string? coverImageUrl, List<string>? additionalImageUrls)
    {
        entity.Name = request.Name.Trim();
        entity.SAPCode = request.SAPCode.Trim();
        entity.ItemType = request.ItemType.Trim();
        entity.CategoryId = string.IsNullOrWhiteSpace(request.CategoryId) ? null : request.CategoryId.Trim();
        
        if (!string.IsNullOrEmpty(coverImageUrl))
        {
            entity.CoverImage = coverImageUrl;
        }

        if (additionalImageUrls != null && additionalImageUrls.Count > 0)
        {
            entity.AdditionalImages = additionalImageUrls.Select((url, index) => new AdditionalImage { No = index + 1, Image = url }).ToList();
        }

        entity.UomGroupId = string.IsNullOrWhiteSpace(request.UomGroupId) ? null : request.UomGroupId.Trim();
        entity.BaseUomCode = request.BaseUomCode.Trim();
        entity.Description = request.Description.Trim();
        entity.Weight = request.Weight;
        entity.Stock = request.Stock;
        entity.IsActive = request.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;
    }

    public static bool HasEmbeddedUomGroup(this CreateItemRequest request) =>
        request.UomGroup is not null;

    public static bool HasEmbeddedUomGroup(this CreateItemWithFilesRequest request) =>
        request.UomGroup is not null;

    public static CreateItemRequest ToCreateItemRequest(this SyncItemRequest request) => new()
    {
        Name = request.Name,
        SAPCode = request.SAPCode,
        ItemType = request.ItemType,
        UomGroup = request.UomGroup,
        Description = request.Description,
        IsActive = request.IsActive
    };

    public static UpdateItemRequest ToUpdateItemRequest(this SyncItemRequest request) => new()
    {
        Name = request.Name,
        SAPCode = request.SAPCode,
        ItemType = request.ItemType,
        UomGroup = request.UomGroup,
        Description = request.Description,
        IsActive = request.IsActive
    };

    public static string ResolveBaseUomCode(this CreateUomGroupRequest? request)
    {
        if (request is null)
        {
            return string.Empty;
        }

        var baseDetail = request.Details.FirstOrDefault(detail => detail.IsBaseUom);
        if (baseDetail is not null && !string.IsNullOrWhiteSpace(baseDetail.Code))
        {
            return baseDetail.Code.Trim();
        }

        return request.BaseUomCode.Trim();
    }

    public static UomGroupResponse ToResponse(this UomGroupEntity entity) => new()
    {
        Id = entity.Id ?? string.Empty,
        Name = entity.Name,
        BaseUomCode = entity.BaseUomCode,
        Details = entity.Details.Select(ToResponse).ToList(),
        IsActive = entity.IsActive,
        Alias = entity.Alias ?? string.Empty
    };

    public static UomGroupEntity ToEntity(this CreateUomGroupRequest request) => new()
    {
        Name = request.Name.Trim(),
        BaseUomCode = request.BaseUomCode.Trim(),
        Details = request.Details.Select(ToEntity).ToList(),
        IsActive = request.IsActive
    };

    public static void UpdateFrom(this UomGroupEntity entity, UpdateUomGroupRequest request)
    {
        entity.Name = request.Name.Trim();
        entity.BaseUomCode = request.BaseUomCode.Trim();
        entity.Details = request.Details.Select(ToEntity).ToList();
        entity.IsActive = request.IsActive;
    }

    public static UomGroupDetailResponse ToResponse(this UomGroupDetailEntity entity) => new()
    {
        Code = entity.Code,
        Name = entity.Name,
        ConversionFactor = entity.ConversionFactor,
        IsBaseUom = entity.IsBaseUom,
        IsDefaultForSales = entity.IsDefaultForSales,
        SortOrder = entity.SortOrder,
        IsActive = entity.IsActive
    };

    public static UomGroupDetailEntity ToEntity(this UomGroupDetailRequest request) => new()
    {
        Code = request.Code.Trim(),
        Name = request.Name.Trim(),
        ConversionFactor = request.ConversionFactor,
        IsBaseUom = request.IsBaseUom,
        IsDefaultForSales = request.IsDefaultForSales,
        SortOrder = request.SortOrder,
        IsActive = request.IsActive
    };

    public static PricingResponse ToResponse(this PricingEntity entity) => new()
    {
        Id = entity.Id ?? string.Empty,
        Name = entity.Name,
        ItemId = entity.ItemId,
        StartDate = entity.StartDate,
        EndDate = entity.EndDate,
        IsActive = entity.IsActive,
        Details = entity.Details.Select(ToResponse).ToList(),
        CreatedAt = entity.CreatedAt,
        UpdatedAt = entity.UpdatedAt,
        Alias = entity.Alias ?? string.Empty
    };

    public static PricingEntity ToEntity(this CreatePricingRequest request) => new()
    {
        Name = request.Name.Trim(),
        ItemId = string.Empty,
        StartDate = request.StartDate,
        EndDate = request.EndDate,
        IsActive = request.IsActive,
        Details = new List<PricingDetailEntity>(),
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    public static void UpdateFrom(this PricingEntity entity, UpdatePricingRequest request)
    {
        entity.Name = request.Name.Trim();
        entity.StartDate = request.StartDate;
        entity.EndDate = request.EndDate;
        entity.IsActive = request.IsActive;
        entity.Details = new List<PricingDetailEntity>();
        entity.UpdatedAt = DateTime.UtcNow;
    }

    public static PricingDetailResponse ToResponse(this PricingDetailEntity entity) => new()
    {
        CustomerGroupCode = entity.CustomerGroupCode,
        UomCode = entity.UomCode,
        Price = entity.Price
    };

    public static WarehouseResponse ToResponse(this WarehouseEntity entity) => new()
    {
        Id = entity.Id ?? string.Empty,
        Code = entity.Code,
        Name = entity.Name,
        Description = entity.Description,
        IsActive = entity.IsActive,
        CreatedAt = entity.CreatedAt,
        UpdatedAt = entity.UpdatedAt,
        Alias = entity.Alias ?? string.Empty
    };

    public static WarehouseEntity ToEntity(this CreateWarehouseRequest request) => new()
    {
        Code = request.Code.Trim(),
        Name = request.Name.Trim(),
        Description = request.Description.Trim(),
        IsActive = request.IsActive,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    public static void UpdateFrom(this WarehouseEntity entity, UpdateWarehouseRequest request)
    {
        entity.Code = request.Code.Trim();
        entity.Name = request.Name.Trim();
        entity.Description = request.Description.Trim();
        entity.IsActive = request.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;
    }

    public static InventoryMovementResponse ToResponse(this InventoryMovementEntity entity) => new()
    {
        Id = entity.Id ?? string.Empty,
        ItemId = entity.ItemId,
        ItemName = entity.ItemName,
        MovementType = entity.MovementType,
        QuantityDelta = entity.QuantityDelta,
        StockBefore = entity.StockBefore,
        StockAfter = entity.StockAfter,
        ReferenceId = entity.ReferenceId,
        Note = entity.Note,
        CreatedAt = entity.CreatedAt
    };

    public static BookResponse ToResponse(this BookEntity entity, ItemEntity? item = null) => new()
    {
        Id = entity.Id ?? string.Empty,
        ItemId = entity.ItemId,
        Title = item?.Name ?? string.Empty,
        SAPCode = item?.SAPCode ?? string.Empty,
        AuthorIds = entity.AuthorIds.ToList(),
        Authors = [],
        Isbn = entity.Isbn,
        CategoryId = item?.CategoryId ?? string.Empty,
        Description = item?.Description ?? string.Empty,
        CoverImage = item?.CoverImage ?? string.Empty,
        Publisher = entity.Publisher,
        PublishedYear = entity.PublishedYear,
        Pages = entity.Pages,
        Weight = item?.Weight ?? 0,
        Stock = item?.Stock ?? 0,
        QuantitySold = 0,
        Rating = entity.AverageRating,
        AverageRating = entity.AverageRating,
        TotalReviews = entity.TotalReviews,
        CreatedAt = entity.CreatedAt,
        AdditionalImages = item?.AdditionalImages.Select(ToResponse).ToList() ?? []
    };

    public static BookResponse ToResponse(this BookEntity entity, ItemEntity? item, IEnumerable<AuthorEntity> authors) => new()
    {
        Id = entity.Id ?? string.Empty,
        ItemId = entity.ItemId,
        Title = item?.Name ?? string.Empty,
        SAPCode = item?.SAPCode ?? string.Empty,
        AuthorIds = entity.AuthorIds.ToList(),
        Authors = authors.Select(ToResponse).ToList(),
        Isbn = entity.Isbn,
        CategoryId = item?.CategoryId ?? string.Empty,
        Description = item?.Description ?? string.Empty,
        CoverImage = item?.CoverImage ?? string.Empty,
        Publisher = entity.Publisher,
        PublishedYear = entity.PublishedYear,
        Pages = entity.Pages,
        Weight = item?.Weight ?? 0,
        Stock = item?.Stock ?? 0,
        QuantitySold = 0,
        Rating = entity.AverageRating,
        AverageRating = entity.AverageRating,
        TotalReviews = entity.TotalReviews,
        CreatedAt = entity.CreatedAt,
        AdditionalImages = item?.AdditionalImages.Select(ToResponse).ToList() ?? []
    };

    public static BookEntity ToEntity(this CreateBookRequest request) => new()
    {
        ItemId = request.ItemId.Trim(),
        AuthorIds = request.AuthorIds
            .Where(authorId => !string.IsNullOrWhiteSpace(authorId))
            .Select(authorId => authorId.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList(),
        Isbn = request.Isbn.Trim(),
        Publisher = request.Publisher.Trim(),
        PublishedYear = request.PublishedYear,
        Pages = request.Pages,
        AverageRating = 0,
        TotalReviews = 0,
        CreatedAt = DateTime.UtcNow
    };

    public static void UpdateFrom(this BookEntity entity, UpdateBookRequest request)
    {
        entity.ItemId = string.IsNullOrWhiteSpace(request.ItemId) ? entity.ItemId : request.ItemId.Trim();
        entity.AuthorIds = request.AuthorIds
            .Where(authorId => !string.IsNullOrWhiteSpace(authorId))
            .Select(authorId => authorId.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        entity.Isbn = request.Isbn.Trim();
        entity.Publisher = request.Publisher.Trim();
        entity.PublishedYear = request.PublishedYear;
        entity.Pages = request.Pages;
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

    public static AuthorResponse ToResponse(this AuthorEntity entity) => new()
    {
        Id = entity.Id ?? string.Empty,
        Name = entity.Name,
        Role = entity.Role,
        Biography = entity.Biography,
        PhotoUrl = entity.PhotoUrl,
        Alias = entity.Alias ?? string.Empty
    };

    public static AuthorEntity ToEntity(this CreateAuthorRequest request) => new()
    {
        Name = request.Name.Trim(),
        Role = request.Role.Trim(),
        Biography = request.Biography.Trim(),
        PhotoUrl = request.PhotoUrl.Trim()
    };

    public static void UpdateFrom(this AuthorEntity entity, UpdateAuthorRequest request)
    {
        entity.Name = request.Name.Trim();
        entity.Role = request.Role.Trim();
        entity.Biography = request.Biography.Trim();
        entity.PhotoUrl = request.PhotoUrl.Trim();
    }

    public static AuthorEntity ToEntity(this CreateAuthorWithFilesRequest request, string imageUrl) => new()
    {
        Name = request.Name.Trim(),
        Role = request.Role.Trim(),
        Biography = request.Biography.Trim(),
        PhotoUrl = imageUrl
    };

    public static void UpdateFrom(this AuthorEntity entity, UpdateAuthorWithFilesRequest request, string? imageUrl)
    {
        entity.Name = request.Name.Trim();
        entity.Role = request.Role.Trim();
        entity.Biography = request.Biography.Trim();
        if (imageUrl != null)
        {
            entity.PhotoUrl = imageUrl;
        }
    }

    public static PaymentResponse ToResponse(this PaymentEntity entity) => new()
    {
        Id = entity.Id ?? string.Empty,
        Name = entity.Name,
        MethodType = entity.MethodType,
        Fees = entity.Fees.Select(ToResponse).ToList(),
        Alias = entity.Alias ?? string.Empty
    };

    public static PaymentEntity ToEntity(this CreatePaymentRequest request) => new()
    {
        Name = request.Name.Trim(),
        MethodType = request.MethodType.Trim(),
        Fees = request.Fees.Select(ToEntity).ToList()
    };

    public static void UpdateFrom(this PaymentEntity entity, UpdatePaymentRequest request)
    {
        entity.Name = request.Name.Trim();
        entity.MethodType = request.MethodType.Trim();
        entity.Fees = request.Fees.Select(ToEntity).ToList();
    }

    public static PaymentFeeResponse ToResponse(this PaymentFeeEntity entity) => new()
    {
        Code = entity.Code,
        Name = entity.Name,
        Type = entity.Type,
        Value = entity.Value
    };

    public static PaymentFeeEntity ToEntity(this PaymentFeeRequest request) => new()
    {
        Code = request.Code.Trim(),
        Name = request.Name.Trim(),
        Type = request.Type.Trim(),
        Value = request.Value
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

    public static PromotionBannerResponse ToResponse(this PromotionBannerEntity entity) => new()
    {
        Id = entity.Id ?? string.Empty,
        Title = entity.Title,
        Subtitle = entity.Subtitle,
        ImageUrl = entity.ImageUrl,
        TargetUrl = entity.TargetUrl,
        ButtonText = entity.ButtonText,
        TargetType = entity.TargetType ?? string.Empty,
        IsActive = entity.IsActive,
        DisplayOrder = entity.DisplayOrder,
        StartAt = entity.StartAt,
        EndAt = entity.EndAt,
        CreatedAt = entity.CreatedAt,
        UpdatedAt = entity.UpdatedAt,
        Alias = entity.Alias ?? string.Empty
    };

    public static PromotionBannerEntity ToEntity(this CreatePromotionBannerRequest request) => new()
    {
        Title = request.Title.Trim(),
        Subtitle = request.Subtitle.Trim(),
        ImageUrl = request.ImageUrl.Trim(),
        TargetUrl = request.TargetUrl.Trim(),
        ButtonText = request.ButtonText.Trim(),
        TargetType = string.IsNullOrWhiteSpace(request.TargetType) ? null : request.TargetType.Trim(),
        IsActive = request.IsActive,
        DisplayOrder = request.DisplayOrder,
        StartAt = request.StartAt,
        EndAt = request.EndAt,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    public static PromotionBannerEntity ToEntity(this CreatePromotionBannerWithFilesRequest request, string imageUrl) => new()
    {
        Title = request.Title.Trim(),
        Subtitle = request.Subtitle.Trim(),
        ImageUrl = imageUrl,
        TargetUrl = request.TargetUrl.Trim(),
        ButtonText = request.ButtonText.Trim(),
        TargetType = string.IsNullOrWhiteSpace(request.TargetType) ? null : request.TargetType.Trim(),
        IsActive = request.IsActive,
        DisplayOrder = request.DisplayOrder,
        StartAt = request.StartAt,
        EndAt = request.EndAt,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    public static void UpdateFrom(this PromotionBannerEntity entity, UpdatePromotionBannerRequest request)
    {
        entity.Title = request.Title.Trim();
        entity.Subtitle = request.Subtitle.Trim();
        entity.ImageUrl = request.ImageUrl.Trim();
        entity.TargetUrl = request.TargetUrl.Trim();
        entity.ButtonText = request.ButtonText.Trim();
        entity.TargetType = string.IsNullOrWhiteSpace(request.TargetType) ? null : request.TargetType.Trim();
        entity.IsActive = request.IsActive;
        entity.DisplayOrder = request.DisplayOrder;
        entity.StartAt = request.StartAt;
        entity.EndAt = request.EndAt;
        entity.UpdatedAt = DateTime.UtcNow;
    }

    public static void UpdateFrom(this PromotionBannerEntity entity, UpdatePromotionBannerWithFilesRequest request, string? imageUrl)
    {
        entity.Title = request.Title.Trim();
        entity.Subtitle = request.Subtitle.Trim();
        
        if (!string.IsNullOrEmpty(imageUrl))
        {
            entity.ImageUrl = imageUrl;
        }

        entity.TargetUrl = request.TargetUrl.Trim();
        entity.ButtonText = request.ButtonText.Trim();
        entity.TargetType = string.IsNullOrWhiteSpace(request.TargetType) ? null : request.TargetType.Trim();
        entity.IsActive = request.IsActive;
        entity.DisplayOrder = request.DisplayOrder;
        entity.StartAt = request.StartAt;
        entity.EndAt = request.EndAt;
        entity.UpdatedAt = DateTime.UtcNow;
    }

    public static OrderItemResponse ToResponse(this OrderItemEntity entity) => new()
    {
        ItemId = entity.ItemId,
        ItemName = entity.ItemName,
        Title = entity.Title,
        UomCode = entity.UomCode,
        CoverImage = string.Empty,
        Price = entity.Price,
        Quantity = entity.Quantity
    };

    public static OrderItemEntity ToEntity(this CreateOrderItemRequest request) => new()
    {
        ItemId = request.ItemId.Trim(),
        ItemName = request.ItemName.Trim(),
        Title = request.Title.Trim(),
        UomCode = request.UomCode.Trim(),
        Price = request.Price ?? 0,
        Quantity = request.Quantity
    };

    public static OrderItemResponse ToResponse(this OrderItemEntity entity, IReadOnlyDictionary<string, string> coverImagesByItemId) => new()
    {
        ItemId = entity.ItemId,
        ItemName = entity.ItemName,
        Title = entity.Title,
        UomCode = entity.UomCode,
        CoverImage = coverImagesByItemId.TryGetValue(entity.ItemId, out var coverImage) ? coverImage : string.Empty,
        Price = entity.Price,
        Quantity = entity.Quantity
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
                Quantity = item.Quantity,
                GoodsType = item.GoodsType,
                GoodsName = item.GoodsName
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
            GoodsName = item.GoodsName,
            GoodsType = item.GoodsType,
            Quantity = item.Quantity!.Value,
        }).ToList(),
        PartnerName = detail.PartnerName,
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
        CustomerGroupCode = entity.CustomerGroupCode,
        FirstName = entity.FirstName,
        LastName = entity.LastName,
        Phone = entity.Phone
    };

    public static OrderUserEntity ToEntity(this UserEntity entity) => new()
    {
        UserId = entity.UserId.Trim(),
        CustomerGroupCode = string.Empty,
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
        PaymentId = entity.PaymentId,
        PaymentMethod = entity.PaymentMethod,
        PaymentGateway = entity.PaymentGateway,
        PaymentUrl = entity.PaymentUrl,
        IncomingPaymentId = entity.IncomingPaymentId ?? string.Empty,
        ItemsSubtotal = entity.ItemsSubtotal,
        ShippingFee = entity.ShippingFee,
        ShippingInsurance = entity.ShippingInsurance,
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

    public static OrderResponse ToResponse(this OrderEntity entity, IReadOnlyDictionary<string, string> coverImagesByBookId) => new()
    {
        Id = entity.Id ?? string.Empty,
        User = entity.User.ToResponse(),
        Items = entity.Items.Select(item => item.ToResponse(coverImagesByBookId)).ToList(),
        AddressId = entity.AddressId,
        Status = entity.Status,
        PaymentStatus = entity.PaymentStatus,
        PaymentId = entity.PaymentId,
        PaymentMethod = entity.PaymentMethod,
        PaymentGateway = entity.PaymentGateway,
        PaymentUrl = entity.PaymentUrl,
        IncomingPaymentId = entity.IncomingPaymentId ?? string.Empty,
        ItemsSubtotal = entity.ItemsSubtotal,
        ShippingFee = entity.ShippingFee,
        ShippingInsurance = entity.ShippingInsurance,
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
        PaymentId = entity.PaymentId,
        PaymentMethod = entity.PaymentMethod,
        PaymentGateway = entity.PaymentGateway,
        PaymentUrl = entity.PaymentUrl,
        IncomingPaymentId = entity.IncomingPaymentId ?? string.Empty,
        ItemsSubtotal = entity.ItemsSubtotal,
        ShippingFee = entity.ShippingFee,
        ShippingInsurance = entity.ShippingInsurance,
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

    public static OrderEntity ToEntity(this CreateOrderRequest request, UserEntity user, string customerGroupCode)
    {
        var itemsSubtotal = request.Items.Sum(item => (item.Price ?? 0) * item.Quantity);
        var shippingFee = request.ShippingFee;

        var orderUser = user.ToEntity();
        orderUser.CustomerGroupCode = customerGroupCode.Trim();

        return new OrderEntity
        {
            User = orderUser,
            AddressId = request.AddressId.Trim(),
            Items = request.Items.Select(ToEntity).ToList(),
            PaymentId = request.PaymentId.Trim(),
            ItemsSubtotal = itemsSubtotal,
            ShippingFee = shippingFee,
            ShippingInsurance = 0,
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
        ItemId = entity.ItemId,
        UomCode = entity.UomCode,
        Quantity = entity.Quantity
    };

    public static CartItemEntity ToEntity(this AddCartItemRequest request) => new()
    {
        ItemId = request.ItemId.Trim(),
        UomCode = request.UomCode.Trim(),
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
        ItemId = entity.ItemId,
        OrderId = entity.OrderId,
        Rating = entity.Rating,
        Comment = entity.Comment,
        AdditionalImages = entity.AdditionalImages.Select(ToResponse).ToList(),
        CreatedAt = entity.CreatedAt
    };

    public static ReviewEntity ToEntity(this CreateReviewRequest request) => new()
    {
        UserId = request.UserId.Trim(),
        ItemId = request.ItemId.Trim(),
        OrderId = request.OrderId.Trim(),
        Rating = request.Rating,
        Comment = request.Comment.Trim(),
        AdditionalImages = request.AdditionalImages.Select(ToEntity).ToList(),
        CreatedAt = DateTime.UtcNow
    };

    public static ReviewEntity ToEntity(this CreateReviewWithFilesRequest request, List<string> additionalImageUrls) => new()
    {
        UserId = request.UserId.Trim(),
        ItemId = request.ItemId.Trim(),
        OrderId = request.OrderId.Trim(),
        Rating = request.Rating,
        Comment = request.Comment.Trim(),
        AdditionalImages = additionalImageUrls.Select((url, index) => new AdditionalImage { No = index + 1, Image = url }).ToList(),
        CreatedAt = DateTime.UtcNow
    };

    public static ComplaintMessageResponse ToResponse(this ComplaintMessageEntity entity) => new()
    {
        SenderType = entity.SenderType,
        SenderId = entity.SenderId,
        Message = entity.Message,
        AdditionalImages = entity.AdditionalImages.Select(ToResponse).ToList(),
        CreatedAt = entity.CreatedAt
    };

    public static ComplaintResponse ToResponse(this ComplaintEntity entity) => new()
    {
        Id = entity.Id ?? string.Empty,
        UserId = entity.UserId,
        OrderId = entity.OrderId,
        ItemId = entity.ItemId,
        Subject = entity.Subject,
        Description = entity.Description,
        Status = entity.Status,
        CreatedAt = entity.CreatedAt,
        UpdatedAt = entity.UpdatedAt,
        AdditionalImages = entity.AdditionalImages.Select(ToResponse).ToList(),
        Messages = entity.Messages.Select(ToResponse).ToList()
    };

    public static ComplaintEntity ToEntity(this CreateComplaintRequest request) => new()
    {
        UserId = (request.UserId ?? string.Empty).Trim(),
        OrderId = (request.OrderId ?? string.Empty).Trim(),
        ItemId = (request.ItemId ?? string.Empty).Trim(),
        Subject = (request.Subject ?? string.Empty).Trim(),
        Description = (request.Description ?? string.Empty).Trim(),
        AdditionalImages = request.AdditionalImages.Select(ToEntity).ToList(),
        Status = "open",
        Messages =
        [
            new ComplaintMessageEntity
            {
                SenderType = "customer",
                SenderId = (request.UserId ?? string.Empty).Trim(),
                Message = (request.Description ?? string.Empty).Trim(),
                AdditionalImages = request.AdditionalImages.Select(ToEntity).ToList(),
                CreatedAt = DateTime.UtcNow
            }
        ],
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    public static ComplaintEntity ToEntity(this CreateComplaintWithFilesRequest request, List<string> additionalImageUrls) => new()
    {
        UserId = (request.UserId ?? string.Empty).Trim(),
        OrderId = (request.OrderId ?? string.Empty).Trim(),
        ItemId = (request.ItemId ?? string.Empty).Trim(),
        Subject = (request.Subject ?? string.Empty).Trim(),
        Description = (request.Description ?? string.Empty).Trim(),
        AdditionalImages = additionalImageUrls.Select((url, index) => new AdditionalImage { No = index + 1, Image = url }).ToList(),
        Status = "open",
        Messages =
        [
            new ComplaintMessageEntity
            {
                SenderType = "customer",
                SenderId = (request.UserId ?? string.Empty).Trim(),
                Message = (request.Description ?? string.Empty).Trim(),
                AdditionalImages = additionalImageUrls.Select((url, index) => new AdditionalImage { No = index + 1, Image = url }).ToList(),
                CreatedAt = DateTime.UtcNow
            }
        ],
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    public static void UpdateFrom(this ComplaintEntity entity, RespondComplaintRequest request)
    {
        entity.Status = request.Status.Trim();
        entity.Messages.Add(new ComplaintMessageEntity
        {
            SenderType = request.SenderType.Trim(),
            SenderId = request.SenderId.Trim(),
            Message = request.Message.Trim(),
            AdditionalImages = request.AdditionalImages.Select(ToEntity).ToList(),
            CreatedAt = DateTime.UtcNow
        });
        entity.UpdatedAt = DateTime.UtcNow;
    }

    public static void UpdateFrom(this ComplaintEntity entity, RespondComplaintWithFilesRequest request, List<string> additionalImageUrls)
    {
        entity.Status = request.Status.Trim();
        entity.Messages.Add(new ComplaintMessageEntity
        {
            SenderType = request.SenderType.Trim(),
            SenderId = request.SenderId.Trim(),
            Message = request.Message.Trim(),
            AdditionalImages = additionalImageUrls.Select((url, index) => new AdditionalImage { No = index + 1, Image = url }).ToList(),
            CreatedAt = DateTime.UtcNow
        });
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
