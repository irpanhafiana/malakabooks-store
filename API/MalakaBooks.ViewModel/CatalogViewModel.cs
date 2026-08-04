using Microsoft.AspNetCore.Http;

namespace MalakaBooks.ViewModel;

public class ItemResponse
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string SAPCode { get; set; } = string.Empty;
    public string ItemType { get; set; } = string.Empty;
    public string? CategoryId { get; set; }
    public string CoverImage { get; set; } = string.Empty;
    public List<AdditionalImageRequest> AdditionalImages { get; set; } = [];
    public string? UomGroupId { get; set; }
    public UomGroupResponse? UomGroup { get; set; }
    public string BaseUomCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Weight { get; set; }
    public int Stock { get; set; }
    public bool IsActive { get; set; }
    public ItemMetadataResponse? Metadata { get; set; }
    public int QuantitySold { get; set; }
    public double Rating { get; set; }
    public double AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ItemAutofillResponse
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class ItemMetadataResponse
{
    public BookItemMetadataResponse? Book { get; set; }
}

public class BookItemMetadataResponse
{
    public string Id { get; set; } = string.Empty;
    public string Isbn { get; set; } = string.Empty;
    public List<ItemMetadataAuthorResponse> Authors { get; set; } = [];
    public string Publisher { get; set; } = string.Empty;
    public int PublishedYear { get; set; }
    public int Pages { get; set; }
}

public class ItemMetadataAuthorResponse
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class PricedItemResponse : ItemResponse
{
    public string SalesUomCode { get; set; } = string.Empty;
    public string CustomerGroupCode { get; set; } = string.Empty;
    public decimal? Price { get; set; }
    public DateTime? PriceStartDate { get; set; }
    public DateTime? PriceEndDate { get; set; }
    // Secondary / compare-at price for promotion display (e.g. strike-through price)
    public decimal? CompareAtPrice { get; set; }
    public DateTime? CompareAtPriceStartDate { get; set; }
    public DateTime? CompareAtPriceEndDate { get; set; }
}

public class CreateItemRequest
{
    public string Name { get; set; } = string.Empty;
    public string SAPCode { get; set; } = string.Empty;
    public string ItemType { get; set; } = string.Empty;
    public string? CategoryId { get; set; }
    public string CoverImage { get; set; } = string.Empty;
    public List<AdditionalImageRequest> AdditionalImages { get; set; } = [];
    public string? UomGroupId { get; set; }
    public CreateUomGroupRequest? UomGroup { get; set; }
    public string BaseUomCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Weight { get; set; }
    public int Stock { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateItemRequest : CreateItemRequest
{
}

public class CreateItemWithFilesRequest
{
    public string Name { get; set; } = string.Empty;
    public string SAPCode { get; set; } = string.Empty;
    public string ItemType { get; set; } = string.Empty;
    public string? CategoryId { get; set; }
    public IFormFile? CoverImage { get; set; }
    public List<IFormFile>? AdditionalImages { get; set; } = [];
    public string? UomGroupId { get; set; }
    public CreateUomGroupRequest? UomGroup { get; set; }
    public string BaseUomCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Weight { get; set; }
    public int Stock { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateItemWithFilesRequest : CreateItemWithFilesRequest
{
}

public class SyncItemRequest
{
    public string Name { get; set; } = string.Empty;
    public string SAPCode { get; set; } = string.Empty;
    public string ItemType { get; set; } = string.Empty;
    public CreateUomGroupRequest UomGroup { get; set; } = new();
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public class UomGroupResponse
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string BaseUomCode { get; set; } = string.Empty;
    public List<UomGroupDetailResponse> Details { get; set; } = [];
    public bool IsActive { get; set; }
    public string Alias { get; set; } = string.Empty;
}

public class CreateUomGroupRequest
{
    public string Name { get; set; } = string.Empty;
    public string BaseUomCode { get; set; } = string.Empty;
    public List<UomGroupDetailRequest> Details { get; set; } = [];
    public bool IsActive { get; set; } = true;
}

public class UpdateUomGroupRequest : CreateUomGroupRequest
{
}

public class UomGroupDetailRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal ConversionFactor { get; set; }
    public bool IsBaseUom { get; set; }
    public bool IsDefaultForSales { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UomGroupDetailResponse : UomGroupDetailRequest
{
}

public class PricingResponse
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ItemId { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
    public List<PricingDetailResponse> Details { get; set; } = [];
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string Alias { get; set; } = string.Empty;
}

public class CreatePricingRequest
{
    public string Name { get; set; } = string.Empty;
    public string ItemCode { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; } = true;
    public List<PricingDetailRequest> Details { get; set; } = [];
}

public class UpdatePricingRequest : CreatePricingRequest
{
}

public class PricingDetailRequest
{
    public string CustomerGroupCode { get; set; } = string.Empty;
    public string UomCode { get; set; } = string.Empty;
    public decimal Price { get; set; }
}

public class PricingDetailResponse
{
    public string CustomerGroupCode { get; set; } = string.Empty;
    public string UomCode { get; set; } = string.Empty;
    public decimal Price { get; set; }
}

public class CreatePricingResponse
{
    public bool IsSuccess { get; set; }
    public string Message { get; set; } = string.Empty;
    public Dictionary<string, string> Errors { get; set; } = [];
    public string PricingId { get; set; } = string.Empty;
}

public class PublicPriceLookupRequest
{
    public string ItemId { get; set; } = string.Empty;
    public string UomCode { get; set; } = string.Empty;
    public string? CustomerGroupCode { get; set; }
}

public class CustomerPriceLookupRequest
{
    public string ItemId { get; set; } = string.Empty;
    public string UomCode { get; set; } = string.Empty;
}

public class PublicPriceLookupResponse
{
    public string ItemId { get; set; } = string.Empty;
    public string UomCode { get; set; } = string.Empty;
    public string CustomerGroupCode { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

public class WarehouseResponse
{
    public string Id { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string Alias { get; set; } = string.Empty;
}

public class CreateWarehouseRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public class UpdateWarehouseRequest : CreateWarehouseRequest
{
}

public class GoodsReceiveRequest
{
    public string ItemId { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string ReferenceId { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
}
