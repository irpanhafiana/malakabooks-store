namespace MalakaBooks.ViewModel;

public class AddressResponse
{
  public string Id { get; set; } = string.Empty;
  public string UserId { get; set; } = string.Empty;
  public string Label { get; set; } = string.Empty;
  public string RecipientName { get; set; } = string.Empty;
  public string Phone { get; set; } = string.Empty;
  public string Street { get; set; } = string.Empty;
  public string Province { get; set; } = string.Empty;
  public string City { get; set; } = string.Empty;
  public string District { get; set; } = string.Empty;
  public string SubDistrict { get; set; } = string.Empty;
  public string PostalCode { get; set; } = string.Empty;
  public long Longitude { get; set; }
  public long Latitude { get; set; }
  public bool IsDefault { get; set; }
}

public class CreateAddressRequest
{
  public string UserId { get; set; } = string.Empty;
  public string Label { get; set; } = string.Empty;
  public string RecipientName { get; set; } = string.Empty;
  public string Phone { get; set; } = string.Empty;
  public string Street { get; set; } = string.Empty;
  public string Province { get; set; } = string.Empty;
  public string City { get; set; } = string.Empty;
  public string District { get; set; } = string.Empty;
  public string SubDistrict { get; set; } = string.Empty;
  public string PostalCode { get; set; } = string.Empty;
  public long Longitude { get; set; }
  public long Latitude { get; set; }
  public bool IsDefault { get; set; }
}

public class UpdateAddressRequest : CreateAddressRequest
{
}
