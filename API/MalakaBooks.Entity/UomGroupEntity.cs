namespace MalakaBooks.Entity;

public class UomGroupEntity : BaseObject
{
    public string Name { get; set; } = string.Empty;
    public string BaseUomCode { get; set; } = string.Empty;
    public List<UomGroupDetailEntity> Details { get; set; } = [];
    public bool IsActive { get; set; } = true;
}

public class UomGroupDetailEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal ConversionFactor { get; set; }
    public bool IsBaseUom { get; set; }
    public bool IsDefaultForSales { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
