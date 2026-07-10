namespace MalakaBooks.Repository.Configuration;

public class MongoDbSetting
{
    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = string.Empty;
    public string BooksCollection { get; set; } = "books";
    public string ItemsCollection { get; set; } = "items";
    public string UomGroupsCollection { get; set; } = "uomgroups";
    public string PricingsCollection { get; set; } = "pricings";
    public string WarehousesCollection { get; set; } = "warehouses";
    public string WarehouseStocksCollection { get; set; } = "warehousestocks";
    public string AuthorsCollection { get; set; } = "authors";
    public string PaymentsCollection { get; set; } = "payments";
    public string CategoriesCollection { get; set; } = "categories";
    public string OrdersCollection { get; set; } = "orders";
    public string IncomingPaymentsCollection { get; set; } = "incomingpayments";
    public string CartsCollection { get; set; } = "carts";
    public string AddressesCollection { get; set; } = "addresses";
    public string HomeAddressesCollection { get; set; } = "homeaddresses";
    public string UsersCollection { get; set; } = "users";
    public string ReviewsCollection { get; set; } = "reviews";
    public string InventoryMovementsCollection { get; set; } = "inventorymovements";
    public string ComplaintsCollection { get; set; } = "complaints";
    public string PromotionBannersCollection { get; set; } = "promotionbanners";
}
