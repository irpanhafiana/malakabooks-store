namespace MalakaBooks.ViewModel.Doku
{

    public class DokuObject
    {
        public Order? order { get; set; }
        public Payment? payment { get; set; }
        public Customer? customer { get; set; }
        //public Shipping_Address shipping_address { get; set; }
        //public Billing_Address billing_address { get; set; }

        public required Additional_Info additional_info { get; set; } = new();
    }

    public class Order
    {
        public int amount { get; set; }
        public string? invoice_number { get; set; }
        public string? callback_url { get; set; } = "https://mardikakopi.com/";
        public string? callback_url_result { get; set; }
        public string language { get; set; } = "ID";
        public bool auto_redirect { get; set; } = false;
        public bool disable_retry_payment { get; set; } = false;
        public Line_Items[] line_items { get; set; } = [];
    }

    public class Line_Items
    {
        public string? id { get; set; }
        public string? name { get; set; }
        public int quantity { get; set; }
        public int price { get; set; }
        public string? sku { get; set; }
        public string? category { get; set; } = "food-and-beverage";
        public string? url { get; set; }
        public string? image_url { get; set; }
        public string? type { get; set; }
    }

    public class Payment
    {
        public int payment_due_date { get; set; } = 15;
        public string type { get; set; } = "SALE";
        public string[] payment_method_types { get; set; } = new string[] { "QRIS" };

        //response	
        public string? token_id { get; set; }
        public string? url { get; set; }
    }

    public class Customer
    {
        public string? id { get; set; }
        public string? name { get; set; }
        public string? last_name { get; set; }
        public string? phone { get; set; }
        public string? email { get; set; }
        public string? address { get; set; }
        public string? postcode { get; set; }
        public string? state { get; set; }
        public string? city { get; set; }
        public string? country { get; set; }
    }

    //public class Shipping_Address
    //{
    //	public string first_name { get; set; }
    //	public string last_name { get; set; }
    //	public string address { get; set; }
    //	public string city { get; set; }
    //	public string postal_code { get; set; }
    //	public string phone { get; set; }
    //	public string country_code { get; set; }
    //}

    //public class Billing_Address
    //{
    //	public string first_name { get; set; }
    //	public string last_name { get; set; }
    //	public string address { get; set; }
    //	public string city { get; set; }
    //	public string postal_code { get; set; }
    //	public string phone { get; set; }
    //	public string country_code { get; set; }
    //}

    public class Additional_Info
    {
        public string? override_notification_url { get; set; }
    }


    public class DokuResponse
    {
        public required string[] message { get; set; }
        public required DokuObject response { get; set; }

        public required string[] error_messages { get; set; }
    }

}
