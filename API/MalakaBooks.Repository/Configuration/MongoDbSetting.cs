namespace MalakaBooks.Repository.Configuration;

public class MongoDbSetting
{
    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = string.Empty;
    public string BooksCollection { get; set; } = "books";
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
    public string ComplaintsCollection { get; set; } = "complaints";
}
