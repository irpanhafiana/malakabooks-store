namespace MalakaBooks.Entity;


public class HomeAddressEntity : BaseObject
{
    public string Label { get; set; } = string.Empty;

    public string AddressCode { get; set; } = string.Empty;

    public string RecipientName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string SubDistrict { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public decimal Longitude { get; set; }
    public decimal Latitude { get; set; }
}

public class AddressEntity : HomeAddressEntity
{
    public string UserId { get; set; } = string.Empty;

    public bool IsDefault { get; set; }
}
