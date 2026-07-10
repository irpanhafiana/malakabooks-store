namespace MalakaBooks.ViewModel;

public class ItemResponse
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string SAPCode { get; set; } = string.Empty;
    public string ItemType { get; set; } = string.Empty;
    public string? UomGroupId { get; set; }
    public string BaseUomCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateItemRequest
{
    public string Name { get; set; } = string.Empty;
    public string SAPCode { get; set; } = string.Empty;
    public string ItemType { get; set; } = string.Empty;
    public string? UomGroupId { get; set; }
    public string BaseUomCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public class UpdateItemRequest : CreateItemRequest
{
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
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UomGroupDetailResponse : UomGroupDetailRequest
{
}

public class PricingResponse
{
    public string Id { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string CustomerGroupCode { get; set; } = string.Empty;
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
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string CustomerGroupCode { get; set; } = string.Empty;
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
    public string ItemId { get; set; } = string.Empty;
    public string UomCode { get; set; } = string.Empty;
    public decimal Price { get; set; }
}

public class PricingDetailResponse : PricingDetailRequest
{
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

public class WarehouseStockResponse
{
    public string Id { get; set; } = string.Empty;
    public string BaseUomCode { get; set; } = string.Empty;
    public string WarehouseId { get; set; } = string.Empty;
    public string ItemId { get; set; } = string.Empty;
    public decimal QuantityOnHand { get; set; }
    public decimal ReservedQuantity { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string Alias { get; set; } = string.Empty;
}

public class CreateWarehouseStockRequest
{
    public string BaseUomCode { get; set; } = string.Empty;
    public string WarehouseId { get; set; } = string.Empty;
    public string ItemId { get; set; } = string.Empty;
    public decimal QuantityOnHand { get; set; }
    public decimal ReservedQuantity { get; set; }
}

public class UpdateWarehouseStockRequest : CreateWarehouseStockRequest
{
}
